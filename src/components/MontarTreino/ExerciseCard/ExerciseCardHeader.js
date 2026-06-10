// src/components/MontarTreino/ExerciseCard/ExerciseCardHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from '../SmartThumbnail';

export default function ExerciseCardHeader({ item, index, theme, isCardio, isExpanded, onToggleExpand, onPreview, drag }) {
    const isWeb = Platform.OS === 'web';

    const dragHandleContent = isWeb ? (
        <View style={S.webMoveRow}>
            <TouchableOpacity style={[S.webBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} onPress={() => item.onMoveUp?.()}>
                <MaterialCommunityIcons name="arrow-up" size={13} color={theme.textSecondary} />
                <Text style={[S.webBtnText, { color: theme.textSecondary }]}>Subir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.webBtn, { backgroundColor: isExpanded ? theme.accent + '18' : (theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'), borderColor: isExpanded ? theme.accent + '40' : (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)') }]} onPress={onToggleExpand}>
                <MaterialCommunityIcons name={isExpanded ? 'unfold-less-horizontal' : 'unfold-more-horizontal'} size={13} color={isExpanded ? theme.accent : theme.textSecondary} />
                <Text style={[S.webBtnText, { color: isExpanded ? theme.accent : theme.textSecondary }]}>{isExpanded ? 'Minimizar' : 'Expandir'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.webBtn, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }]} onPress={() => item.onMoveDown?.()}>
                <MaterialCommunityIcons name="arrow-down" size={13} color={theme.textSecondary} />
                <Text style={[S.webBtnText, { color: theme.textSecondary }]}>Descer</Text>
            </TouchableOpacity>
        </View>
    ) : (
        <TouchableOpacity onLongPress={drag} style={S.dragTouch} delayLongPress={150}>
            <MaterialCommunityIcons name="drag-horizontal-variant" size={20} color={theme.textSecondary} />
            <Text style={[S.dragHint, { color: theme.textSecondary }]}>Segure para reordenar</Text>
        </TouchableOpacity>
    );

    return (
        <>
            <View style={[S.dragHandle, {
                backgroundColor: isCardio ? `${theme.accent}10` : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                borderBottomColor: theme.border,
                minHeight: isWeb ? 'auto' : 38,
            }]}>
                {dragHandleContent}
            </View>
            <View style={[S.thumbRow, { borderBottomColor: theme.border }]}>
                <TouchableOpacity style={S.thumb} onPress={onPreview}>
                    <SmartThumbnail url={item.exercise?.videoUrl || item.videoUrl} style={StyleSheet.absoluteFillObject} theme={theme} />
                    <View style={S.playOverlay}>
                        <MaterialCommunityIcons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                    </View>
                </TouchableOpacity>
                <View style={S.info}>
                    {isCardio && (
                        <View style={[S.cardioBadge, { backgroundColor: theme.accent + '20' }]}>
                            <MaterialCommunityIcons name="heart-pulse" size={10} color={theme.accent} />
                            <Text style={[S.cardioBadgeText, { color: theme.accent }]}>CARDIO</Text>
                        </View>
                    )}
                    <Text style={[S.title, { color: theme.text }]} numberOfLines={2}>{index + 1}. {item.title}</Text>
                </View>
                {!isWeb && (
                    <TouchableOpacity style={[S.mobileExpand, { backgroundColor: isExpanded ? theme.accent + '18' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') }]} onPress={onToggleExpand}>
                        <MaterialCommunityIcons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={isExpanded ? theme.accent : theme.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}

const S = StyleSheet.create({
    dragHandle:    { justifyContent: 'center', alignItems: 'center' },
    dragTouch:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 38, width: '100%', justifyContent: 'center' },
    dragHint:      { fontSize: 10, fontWeight: '600' },
    webMoveRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8, gap: 8, width: '100%' },
    webBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, minWidth: 80 },
    webBtnText:    { fontSize: 11, fontWeight: '700' },
    thumbRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderBottomWidth: 1 },
    thumb:         { width: 90, height: 68, borderRadius: 10, overflow: 'hidden', backgroundColor: '#111', position: 'relative', flexShrink: 0 },
    playOverlay:   { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
    info:          { flex: 1, gap: 5 },
    title:         { fontSize: 14, fontWeight: '800', lineHeight: 19 },
    cardioBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    cardioBadgeText:{ fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    mobileExpand:  { padding: 8, borderRadius: 8 },
});