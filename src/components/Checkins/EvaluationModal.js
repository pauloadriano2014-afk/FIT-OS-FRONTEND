// src/components/Checkins/EvaluationModal.js — v3
// v3: fotos do check-in atual visíveis em AMBOS os modos (initial + comparison),
//     seletor de modelo de IA (só masters), contextText corrigido

import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Image, Platform, Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AI_MODELS = [
    { key: 'gemini-flash', label: 'Gemini Flash', sub: 'Rápido · Barato',  icon: 'lightning-bolt' },
    { key: 'gemini-pro',   label: 'Gemini Pro',   sub: 'Mais detalhado',   icon: 'star-outline'   },
    { key: 'claude-haiku', label: 'Claude Haiku', sub: 'Melhor em PT-BR',  icon: 'brain'          },
    { key: 'gpt-4o-mini',  label: 'GPT-4o mini',  sub: 'Ultra barato',     icon: 'robot'          },
];

// ─── Subcomponente: grid de fotos do check-in atual (sempre visível) ─────────
function CurrentPhotosGrid({ checkin, theme, onPressPhoto }) {
    if (!checkin) return null;
    const photos = [
        { uri: checkin.photoFront, label: 'FRENTE' },
        { uri: checkin.photoSide,  label: 'LADO'   },
        { uri: checkin.photoBack,  label: 'COSTAS' },
    ].filter(p => p.uri);

    if (!photos.length) return null;

    return (
        <View style={{ marginBottom: 20 }}>
            <View style={[styles.currentPhotoBadge, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                <MaterialCommunityIcons name="camera" size={12} color={theme.accent} />
                <Text style={{ fontSize: 10, fontWeight: '900', color: theme.accent, marginLeft: 5, letterSpacing: 0.5 }}>
                    ATUAL: {checkin.weight ? `${checkin.weight}kg` : '--'}
                </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {photos.map(({ uri, label }) => (
                    <TouchableOpacity
                        key={label}
                        style={{ flex: 1, alignItems: 'center' }}
                        onPress={() => onPressPhoto?.(uri)}
                    >
                        <Image
                            source={{ uri }}
                            style={[styles.currentPhoto, { borderColor: theme.accent }]}
                            resizeMode="cover"
                        />
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: theme.textSecondary, marginTop: 4 }}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

// ─── Subcomponente: fotos lado a lado no comparativo ─────────────────────────
function ComparePhotosGrid({ theme, hookData }) {
    const { evaluationType, compareSource, getOldCheckin, savedCompareUrls, currentCheckinForEval } = hookData;

    if (evaluationType !== 'comparison') return null;

    const oldCheckin = getOldCheckin();
    const hasOld     = !!(oldCheckin || savedCompareUrls);
    if (!hasOld) return null;

    const oldFrontUri = oldCheckin?.photoFront ?? (savedCompareUrls ? savedCompareUrls.split('|')[0] : null);

    return (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            {/* ANTES */}
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={[styles.compareBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.compareLabel, { color: theme.textSecondary }]}>
                        ANTES: {oldCheckin?.weight ? `${oldCheckin.weight}kg` : '--'}
                    </Text>
                </View>
                <Image
                    source={{ uri: oldFrontUri }}
                    style={[styles.comparePhotoImg, { borderColor: theme.border }]}
                    resizeMode="contain"
                />
            </View>
            {/* ATUAL */}
            <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={[styles.compareBadge, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                    <Text style={[styles.compareLabel, { color: theme.accent }]}>
                        ATUAL: {currentCheckinForEval?.weight ?? '--'}kg
                    </Text>
                </View>
                <Image
                    source={{ uri: currentCheckinForEval?.photoFront }}
                    style={[styles.comparePhotoImg, { borderColor: theme.accent }]}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function EvaluationModal({ theme, hookData }) {
    const {
        evaluationModalVisible, setEvaluationModalVisible,
        evaluationType, handleTabChange,
        compareSource, setCompareSource,
        showDatePicker, setShowDatePicker,
        getOldCheckin, safeDate, savedCompareUrls,
        checkins, currentCheckinForEval,
        setSelectedOldCheckinId, setSavedCompareUrls, selectedOldCheckinId,
        pickCustomOldImage, removeCustomOldImage,
        oldFront, oldSide, oldBack,
        customOldDate, setCustomOldDate,
        customOldWeight, setCustomOldWeight,
        contextText, setContextText,
        generateAIFeedback, isGeneratingAI,
        feedbackText, setFeedbackText,
        submitEvaluation, sendingEvaluation,
        aiModel, setAiModel, isMaster,
        openPhoto,
    } = hookData;

    if (!evaluationModalVisible) return null;

    const selectedModelLabel = AI_MODELS.find(m => m.key === aiModel)?.label ?? 'IA';

    return (
        <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                {/* ── Header ── */}
                <View style={[styles.modalHeader, { borderBottomColor: 'rgba(128,128,128,0.2)' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <MaterialCommunityIcons name="bullseye-arrow" size={24} color={theme.accent} />
                        <Text style={[styles.modalTitle, { color: theme.text }]}>PAINEL DE ANÁLISE</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEvaluationModalVisible(false)} style={{ padding: 5 }}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ padding: 25, paddingBottom: 80 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                >
                    {/* ── Abas ── */}
                    <View style={{ flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.border }}>
                        {[
                            { key: 'initial',    label: 'ANÁLISE ÚNICA' },
                            { key: 'comparison', label: 'COMPARATIVO'   },
                        ].map(tab => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tabBtn, { backgroundColor: evaluationType === tab.key ? theme.accent : 'transparent' }]}
                                onPress={() => handleTabChange(tab.key)}
                            >
                                <Text style={[styles.tabBtnText, { color: evaluationType === tab.key ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* ── Fotos ATUAIS — sempre visíveis em ambos os modos ── */}
                    <CurrentPhotosGrid
                        checkin={currentCheckinForEval}
                        theme={theme}
                        onPressPhoto={(uri) => openPhoto?.(uri)}
                    />

                    {/* ── Bloco comparativo (só no modo comparison) ── */}
                    {evaluationType === 'comparison' && (
                        <View style={{ marginBottom: 20, padding: 15, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
                            {/* Toggle SISTEMA / GALERIA */}
                            <View style={{ flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 8, padding: 4, marginBottom: 15, borderWidth: 1, borderColor: theme.border }}>
                                {['system', 'gallery'].map(src => (
                                    <TouchableOpacity
                                        key={src}
                                        style={[styles.sourceBtn, { backgroundColor: compareSource === src ? theme.accent + '22' : 'transparent' }]}
                                        onPress={() => setCompareSource(src)}
                                    >
                                        <Text style={[styles.sourceBtnText, { color: compareSource === src ? theme.accent : theme.textSecondary }]}>
                                            {src === 'system' ? 'SISTEMA' : 'GALERIA'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {compareSource === 'system' ? (
                                <>
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5 }}>
                                        SELECIONE A FOTO BASE DO APLICATIVO
                                    </Text>
                                    <TouchableOpacity
                                        style={[styles.dateDropdown, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                        onPress={() => setShowDatePicker(!showDatePicker)}
                                    >
                                        <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.textSecondary} />
                                        <Text style={{ flex: 1, color: theme.text, fontWeight: 'bold', fontSize: 13, marginLeft: 10 }}>
                                            {getOldCheckin()
                                                ? safeDate(getOldCheckin().date || getOldCheckin().createdAt).toLocaleDateString('pt-BR')
                                                : (savedCompareUrls ? 'Fotos da base anterior' : 'Escolha uma data...')}
                                        </Text>
                                        <MaterialCommunityIcons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={22} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <View style={[styles.dateList, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            {checkins.filter(c => c.id !== currentCheckinForEval?.id).map(c => (
                                                <TouchableOpacity
                                                    key={c.id}
                                                    style={[styles.dateListItem, { borderBottomColor: theme.border }]}
                                                    onPress={() => { setSelectedOldCheckinId(c.id); setSavedCompareUrls(null); setShowDatePicker(false); }}
                                                >
                                                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>
                                                        {safeDate(c.date || c.createdAt).toLocaleDateString('pt-BR')}
                                                    </Text>
                                                    {selectedOldCheckinId === c.id && (
                                                        <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: theme.accent, marginBottom: 10, letterSpacing: 0.5 }}>
                                        SELECIONE FOTOS EXTERNAS
                                    </Text>
                                    <View style={styles.slotsContainer}>
                                        {[
                                            { slot: 'front', icon: 'account',           label: 'FRENTE', state: oldFront },
                                            { slot: 'side',  icon: 'human-male-height',  label: 'LADO',   state: oldSide  },
                                            { slot: 'back',  icon: 'account-arrow-left', label: 'COSTAS', state: oldBack  },
                                        ].map(({ slot, icon, label, state }) => (
                                            <TouchableOpacity
                                                key={slot}
                                                style={styles.slotBox}
                                                onPress={() => pickCustomOldImage(slot)}
                                            >
                                                {state ? (
                                                    <>
                                                        <Image source={{ uri: state.uri }} style={styles.slotImg} />
                                                        <TouchableOpacity
                                                            style={styles.slotRemove}
                                                            onPress={() => removeCustomOldImage(slot)}
                                                        >
                                                            <MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" />
                                                        </TouchableOpacity>
                                                    </>
                                                ) : (
                                                    <View style={styles.slotEmpty}>
                                                        <MaterialCommunityIcons name={icon} size={24} color="#555" />
                                                        <Text style={styles.slotLabel}>{label}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                                        {[
                                            { label: 'DATA (OPCIONAL)',  ph: 'Ex: 10/01/26', val: customOldDate,   set: setCustomOldDate,   kb: 'default' },
                                            { label: 'PESO (OPCIONAL)',  ph: 'Ex: 85.5',     val: customOldWeight, set: setCustomOldWeight, kb: 'numeric' },
                                        ].map(({ label, ph, val, set, kb }) => (
                                            <View key={label} style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 10, fontWeight: '900', color: theme.textSecondary, marginBottom: 5, letterSpacing: 0.5 }}>{label}</Text>
                                                <TextInput
                                                    style={[styles.inputSmall, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                                    placeholder={ph}
                                                    placeholderTextColor={theme.textSecondary}
                                                    keyboardType={kb}
                                                    value={val}
                                                    onChangeText={set}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* ── Side-by-side (comparativo: frente da foto antiga vs atual) ── */}
                    <ComparePhotosGrid theme={theme} hookData={hookData} />

                    {/* ── Direcionamento ── */}
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>DIRECIONAMENTO (OPCIONAL)</Text>
                    <TextInput
                        style={[styles.inputContext, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                        placeholder="Ex: Aluno relatou dor no ombro; foque nisso e evite falar do abdômen..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={contextText}
                        onChangeText={setContextText}
                    />

                    {/* ── Seletor de modelo (só masters) ── */}
                    {isMaster && (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 10 }]}>MOTOR DE IA</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {AI_MODELS.map(m => {
                                    const selected = aiModel === m.key;
                                    return (
                                        <TouchableOpacity
                                            key={m.key}
                                            onPress={() => setAiModel(m.key)}
                                            style={[styles.modelChip, {
                                                backgroundColor: selected ? theme.accent + '20' : theme.surface,
                                                borderColor:     selected ? theme.accent         : theme.border,
                                            }]}
                                        >
                                            <MaterialCommunityIcons
                                                name={m.icon}
                                                size={13}
                                                color={selected ? theme.accent : theme.textSecondary}
                                                style={{ marginRight: 5 }}
                                            />
                                            <View>
                                                <Text style={{ fontSize: 11, fontWeight: '900', color: selected ? theme.accent : theme.text, letterSpacing: 0.3 }}>
                                                    {m.label}
                                                </Text>
                                                <Text style={{ fontSize: 9, color: theme.textSecondary, marginTop: 1 }}>
                                                    {m.sub}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ── Botão gerar IA ── */}
                    <TouchableOpacity
                        style={[styles.generateBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}
                        onPress={generateAIFeedback}
                        disabled={isGeneratingAI}
                    >
                        {isGeneratingAI ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <ActivityIndicator color={theme.accent} size="small" />
                                <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 12 }}>
                                    {isMaster ? `Gerando com ${selectedModelLabel}...` : 'Gerando feedback...'}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="robot-outline" size={22} color={theme.accent} />
                                <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 13, marginLeft: 10, letterSpacing: 0.5 }}>
                                    GERAR FEEDBACK COM IA
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* ── Texto da avaliação ── */}
                    <Text style={{ fontSize: 11, fontWeight: '900', color: theme.textSecondary, marginBottom: 10, marginTop: 30, letterSpacing: 0.5 }}>
                        TEXTO DA AVALIAÇÃO (Enviado ao Aluno)
                    </Text>
                    <View style={[styles.evalInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="format-quote-open" size={20} color={theme.accent} style={{ marginBottom: 8 }} />
                        <TextInput
                            style={[styles.evalInput, { color: theme.text }]}
                            multiline
                            placeholder="Digite a avaliação ou deixe a IA fazer o trabalho pesado..."
                            placeholderTextColor={theme.textSecondary}
                            value={feedbackText}
                            onChangeText={setFeedbackText}
                        />
                    </View>

                    {/* ── Submit ── */}
                    <TouchableOpacity
                        style={[styles.submitBtn, {
                            backgroundColor: currentCheckinForEval?.coachFeedback ? theme.surface : theme.accent,
                            borderColor:     currentCheckinForEval?.coachFeedback ? theme.border  : theme.accent,
                            borderWidth: 1,
                        }]}
                        onPress={submitEvaluation}
                        disabled={sendingEvaluation}
                    >
                        {sendingEvaluation ? (
                            <ActivityIndicator color={currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF')} />
                        ) : (
                            <Text style={{ color: currentCheckinForEval?.coachFeedback ? theme.text : (theme.isDark ? '#000' : '#FFF'), fontWeight: '900', fontSize: 14, letterSpacing: 1 }}>
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
    modalBg:            { position: isWeb ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent:       { width: '100%', maxWidth: 960, maxHeight: '90vh', borderRadius: 30, borderWidth: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    scrollView:         { flex: 1, minHeight: 0, ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}) },
    modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1, flexShrink: 0 },
    modalTitle:         { fontSize: 18, fontWeight: '900', letterSpacing: 1 },

    tabBtn:             { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    tabBtnText:         { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    // Fotos atuais
    currentPhotoBadge:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 10 },
    currentPhoto:       { width: '100%', aspectRatio: 0.6, borderRadius: 12, borderWidth: 2, backgroundColor: '#000' },

    // Comparativo side-by-side
    compareBadge:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 8, alignSelf: 'center' },
    compareLabel:       { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    comparePhotoImg:    { width: '100%', height: 220, borderRadius: 14, borderWidth: 2, backgroundColor: '#000' },

    sourceBtn:          { flex: 1, padding: 8, borderRadius: 6, alignItems: 'center' },
    sourceBtnText:      { fontWeight: 'bold', fontSize: 10, letterSpacing: 0.5 },

    slotsContainer:     { flexDirection: 'row', gap: 10 },
    slotBox:            { flex: 1, height: 110, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    slotEmpty:          { alignItems: 'center' },
    slotLabel:          { fontSize: 10, fontWeight: 'bold', color: '#555', marginTop: 4 },
    slotImg:            { width: '100%', height: '100%', resizeMode: 'cover' },
    slotRemove:         { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 10 },

    inputSmall:         { padding: 10, borderRadius: 8, borderWidth: 1, outlineStyle: 'none', fontSize: 13 },
    dateDropdown:       { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1 },
    dateList:           { borderWidth: 1, borderRadius: 12, marginTop: 5, maxHeight: 150, overflow: 'hidden' },
    dateListItem:       { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },

    sectionLabel:       { fontSize: 11, fontWeight: '900', marginTop: 10, marginBottom: 5 },
    inputContext:       { padding: 15, borderRadius: 12, borderWidth: 1, minHeight: 75, textAlignVertical: 'top', outlineStyle: 'none', marginBottom: 20, fontSize: 14, marginTop: 8 },

    modelChip:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },

    generateBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
    evalInputContainer: { padding: 20, borderRadius: 20, borderWidth: 1 },
    evalInput:          { minHeight: 120, fontSize: 15, lineHeight: 24, textAlignVertical: 'top', outlineStyle: 'none' },
    submitBtn:          { padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 28, elevation: 4 },
});