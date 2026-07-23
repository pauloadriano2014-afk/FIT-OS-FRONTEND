// src/components/Checkins/FeedbackEditorModal.js
// Editor fullscreen de texto de avaliação.
// Abre quando o coach toca no campo de feedback.
// Fotos do check-in ficam como miniaturas flutuantes no topo (web) ou fixas no topo (mobile).
// Botão de confirmar fecha e devolve o texto pro EvaluationModal.

import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Modal, Image, ScrollView, KeyboardAvoidingView,
    Platform, Dimensions, Animated, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Miniatura flutuante de foto ──────────────────────────────────────────────
function FloatingPhoto({ uri, label, theme, onPress }) {
    if (!uri) return null;
    return (
        <TouchableOpacity onPress={() => onPress(uri)} activeOpacity={0.85}>
            <View style={styles.floatPhotoWrapper}>
                <Image
                    source={{ uri }}
                    style={[styles.floatPhoto, { borderColor: theme.accent }]}
                    resizeMode="cover"
                />
                <Text style={[styles.floatLabel, { color: theme.textSecondary }]}>{label}</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Lightbox simples para ver a foto em tela cheia ──────────────────────────
function PhotoLightbox({ uri, onClose, theme }) {
    if (!uri) return null;
    return (
        <TouchableOpacity
            style={styles.lightboxBg}
            activeOpacity={1}
            onPress={onClose}
        >
            <TouchableOpacity style={styles.lightboxClose} onPress={onClose}>
                <MaterialCommunityIcons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <Image
                source={{ uri }}
                style={styles.lightboxImg}
                resizeMode="contain"
            />
            <Text style={styles.lightboxHint}>Toque para fechar</Text>
        </TouchableOpacity>
    );
}

// ─── Contador de caracteres / palavras ───────────────────────────────────────
function TextStats({ text, theme }) {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    return (
        <View style={styles.statsRow}>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {words} {words === 1 ? 'palavra' : 'palavras'}
            </Text>
            <Text style={[styles.statDot, { color: theme.border }]}>·</Text>
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {chars} caracteres
            </Text>
        </View>
    );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function FeedbackEditorModal({
    visible,
    value,
    onChange,
    onClose,       // fecha sem salvar
    onConfirm,     // fecha salvando
    checkin,       // check-in atual (para as fotos)
    theme,
}) {
    const inputRef  = useRef(null);
    const [draft, setDraft]         = useState(value ?? '');
    const [lightboxUri, setLightbox] = useState(null);
    const fadeAnim  = useRef(new Animated.Value(0)).current;

    // Sincroniza draft quando o modal abre
    useEffect(() => {
        if (visible) {
            setDraft(value ?? '');
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            // Foca o input após a animação
            setTimeout(() => inputRef.current?.focus(), 250);
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    const handleConfirm = () => {
        onChange?.(draft);
        onConfirm?.();
    };

    const handleClose = () => {
        onChange?.(draft); // preserva o que foi digitado mesmo cancelando
        onClose?.();
    };

    const hasChanges = draft !== (value ?? '');

    const photos = [
        { uri: checkin?.photoFront, label: 'FRENTE' },
        { uri: checkin?.photoSide,  label: 'LADO'   },
        { uri: checkin?.photoBack,  label: 'COSTAS' },
    ].filter(p => p.uri);

    if (!visible) return null;

    // ─── Web: usa position fixed em vez de Modal nativo ──────────────────────
    if (Platform.OS === 'web') {
        return (
            <Animated.View style={[styles.webOverlay, { opacity: fadeAnim }]}>
                <View style={[styles.webContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                    {/* Header */}
                    <View style={[styles.editorHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                            <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, paddingHorizontal: 15 }}>
                            <Text style={[styles.editorTitle, { color: theme.text }]}>EDITOR DE AVALIAÇÃO</Text>
                            <TextStats text={draft} theme={theme} />
                        </View>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
                        >
                            <MaterialCommunityIcons name="check" size={18} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.confirmText, { color: theme.isDark ? '#000' : '#FFF' }]}>
                                CONFIRMAR
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Fotos flutuantes */}
                    {photos.length > 0 && (
                        <View style={[styles.photosBar, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
                            <MaterialCommunityIcons name="image-multiple" size={14} color={theme.textSecondary} style={{ marginRight: 8 }} />
                            {photos.map(p => (
                                <FloatingPhoto
                                    key={p.label}
                                    uri={p.uri}
                                    label={p.label}
                                    theme={theme}
                                    onPress={setLightbox}
                                />
                            ))}
                            <Text style={[styles.photosHint, { color: theme.textSecondary }]}>
                                Toque para ampliar
                            </Text>
                        </View>
                    )}

                    {/* Campo de texto */}
                    <View style={styles.editorBody}>
                        <TextInput
                            ref={inputRef}
                            style={[styles.editorInput, {
                                color: theme.text,
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                            }]}
                            value={draft}
                            onChangeText={setDraft}
                            multiline
                            placeholder="Digite a avaliação aqui..."
                            placeholderTextColor={theme.textSecondary}
                            autoFocus
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Footer */}
                    <View style={[styles.editorFooter, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                        <TouchableOpacity onPress={() => setDraft('')} style={styles.footerAction}>
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                            <Text style={{ fontSize: 12, color: '#FF3B30', marginLeft: 5, fontWeight: '600' }}>Limpar tudo</Text>
                        </TouchableOpacity>
                        <Text style={[styles.changeDot, { color: hasChanges ? theme.accent : 'transparent' }]}>
                            ● Não salvo
                        </Text>
                        <TouchableOpacity
                            onPress={handleConfirm}
                            style={[styles.footerConfirmBtn, { backgroundColor: theme.accent }]}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '900', color: theme.isDark ? '#000' : '#FFF', letterSpacing: 0.5 }}>
                                CONFIRMAR
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Lightbox */}
                {lightboxUri && (
                    <PhotoLightbox uri={lightboxUri} onClose={() => setLightbox(null)} theme={theme} />
                )}
            </Animated.View>
        );
    }

    // ─── Mobile: Modal nativo com KeyboardAvoidingView ────────────────────────
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
            <KeyboardAvoidingView
                style={[styles.mobileContainer, { backgroundColor: theme.bg }]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={[styles.editorHeader, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
                    <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text style={[styles.editorTitle, { color: theme.text }]}>EDITOR</Text>
                        <TextStats text={draft} theme={theme} />
                    </View>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        style={[styles.confirmBtn, { backgroundColor: theme.accent }]}
                    >
                        <MaterialCommunityIcons name="check" size={16} color={theme.isDark ? '#000' : '#FFF'} />
                        <Text style={[styles.confirmText, { color: theme.isDark ? '#000' : '#FFF' }]}>OK</Text>
                    </TouchableOpacity>
                </View>

                {/* Fotos horizontais (scroll) */}
                {photos.length > 0 && (
                    <View style={[styles.mobilePhotosBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 15, paddingVertical: 10 }}>
                            {photos.map(p => (
                                <FloatingPhoto
                                    key={p.label}
                                    uri={p.uri}
                                    label={p.label}
                                    theme={theme}
                                    onPress={setLightbox}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Campo de texto — ocupa todo o espaço restante */}
                <TextInput
                    ref={inputRef}
                    style={[styles.mobileInput, { color: theme.text, backgroundColor: theme.bg }]}
                    value={draft}
                    onChangeText={setDraft}
                    multiline
                    placeholder="Digite a avaliação aqui..."
                    placeholderTextColor={theme.textSecondary}
                    textAlignVertical="top"
                    autoFocus
                    scrollEnabled
                />

                {/* Footer */}
                <View style={[styles.editorFooter, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                    <TouchableOpacity onPress={() => setDraft('')} style={styles.footerAction}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                        <Text style={{ fontSize: 12, color: '#FF3B30', marginLeft: 4, fontWeight: '600' }}>Limpar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        style={[styles.footerConfirmBtn, { backgroundColor: theme.accent }]}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '900', color: theme.isDark ? '#000' : '#FFF', letterSpacing: 0.5 }}>
                            CONFIRMAR
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Lightbox */}
            {lightboxUri && (
                <PhotoLightbox uri={lightboxUri} onClose={() => setLightbox(null)} theme={theme} />
            )}
        </Modal>
    );
}

const styles = StyleSheet.create({
    // ── Web overlay ───────────────────────────────────────────────────────────
    webOverlay: {
        position:        'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex:          99999,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent:  'center',
        alignItems:      'center',
        padding:         20,
    },
    webContainer: {
        width:         '100%',
        maxWidth:      900,
        height:        '90vh',
        borderRadius:  20,
        borderWidth:   1,
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
    },

    // ── Mobile container ──────────────────────────────────────────────────────
    mobileContainer: {
        flex: 1,
    },
    mobilePhotosBar: {
        borderBottomWidth: 1,
    },
    mobileInput: {
        flex:              1,
        fontSize:          16,
        lineHeight:        26,
        padding:           20,
        outlineStyle:      'none',
    },

    // ── Compartilhados ────────────────────────────────────────────────────────
    editorHeader: {
        flexDirection:    'row',
        alignItems:       'center',
        padding:          15,
        paddingHorizontal:20,
        borderBottomWidth: 1,
        flexShrink:       0,
    },
    headerBtn: {
        padding:         8,
        borderRadius:    8,
    },
    editorTitle: {
        fontSize:    13,
        fontWeight:  '900',
        letterSpacing: 0.5,
    },
    confirmBtn: {
        flexDirection:  'row',
        alignItems:     'center',
        gap:            6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius:   10,
    },
    confirmText: {
        fontWeight:  '900',
        fontSize:    12,
        letterSpacing: 0.5,
    },

    // Barra de fotos (web)
    photosBar: {
        flexDirection:  'row',
        alignItems:     'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        gap:            12,
        borderBottomWidth: 1,
        flexShrink:     0,
        flexWrap:       'wrap',
    },
    photosHint: {
        fontSize:   10,
        fontStyle:  'italic',
        marginLeft: 4,
    },

    editorBody: {
        flex:    1,
        padding: 20,
    },
    editorInput: {
        flex:          1,
        fontSize:      15,
        lineHeight:    26,
        padding:       18,
        borderRadius:  16,
        borderWidth:   1,
        outlineStyle:  'none',
        height:        '100%',
        resize:        'none',       // web
        textAlignVertical: 'top',
    },

    editorFooter: {
        flexDirection:    'row',
        alignItems:       'center',
        justifyContent:   'space-between',
        padding:          15,
        paddingHorizontal: 20,
        borderTopWidth:   1,
        flexShrink:       0,
    },
    footerAction: {
        flexDirection: 'row',
        alignItems:    'center',
    },
    changeDot: {
        fontSize:   11,
        fontWeight: '700',
    },
    footerConfirmBtn: {
        paddingHorizontal: 20,
        paddingVertical:   10,
        borderRadius:      10,
    },

    // Foto flutuante
    floatPhotoWrapper: {
        alignItems: 'center',
    },
    floatPhoto: {
        width:        60,
        height:       80,
        borderRadius: 8,
        borderWidth:  1.5,
    },
    floatLabel: {
        fontSize:   8,
        fontWeight: 'bold',
        marginTop:  3,
        letterSpacing: 0.3,
    },

    // Lightbox
    lightboxBg: {
        position:        Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex:          999999,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent:  'center',
        alignItems:      'center',
    },
    lightboxClose: {
        position: 'absolute',
        top:      50,
        right:    20,
        zIndex:   10,
        padding:  10,
    },
    lightboxImg: {
        width:  SCREEN_W * 0.9,
        height: SCREEN_H * 0.75,
    },
    lightboxHint: {
        position:   'absolute',
        bottom:     40,
        color:      'rgba(255,255,255,0.4)',
        fontSize:   12,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems:    'center',
        gap:           5,
        marginTop:     2,
    },
    statText: {
        fontSize: 10,
    },
    statDot: {
        fontSize: 10,
    },
});