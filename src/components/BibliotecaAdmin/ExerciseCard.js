import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from '../MontarTreino/SmartThumbnail';

const ExerciseCard = React.memo(({ item, onPress, onEdit, onDelete, width, theme }) => {
    let displayCat = item.category.toUpperCase();
    if (item.subCategory && item.subCategory !== 'Geral') {
        displayCat += ` • ${item.subCategory.toUpperCase()}`;
    }

    const envTags = item.environments || ['ACADEMIA'];

    return (
        <TouchableOpacity 
            style={[
                styles.mfitCard, 
                { 
                    width: width, 
                    backgroundColor: theme.surface,
                    // Soft UI: Sem bordas, com sombra suave
                    shadowColor: theme.isDark ? '#000' : '#888',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: theme.isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                    elevation: theme.isDark ? 2 : 4,
                }
            ]}
            onPress={() => onPress(item.videoUrl)}
            activeOpacity={0.7}
        >
            <View style={[styles.mfitThumbBox, { backgroundColor: theme.bg }]}>
                <SmartThumbnail 
                    url={item.videoUrl} 
                    style={StyleSheet.absoluteFillObject} 
                    theme={theme} 
                />
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }]}>
                    <MaterialCommunityIcons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                </View>
            </View>

            <View style={styles.mfitInfo}>
                <Text style={[styles.mfitTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.mfitCategory, { color: theme.textSecondary }]}>{displayCat}</Text>

                <View style={styles.tagsContainer}>
                    {envTags.map(env => (
                        <View key={env} style={[styles.envBadge, { backgroundColor: theme.accent + '15' }]}>
                            <Text style={[styles.envBadgeText, { color: theme.accent }]}>{env}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.mfitActionGroup}>
                <TouchableOpacity onPress={() => onEdit(item)} style={[styles.mfitActionBtn, { backgroundColor: theme.bg }]}>
                    <MaterialCommunityIcons name="pencil" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.mfitActionBtn, { backgroundColor: '#FF3B3015' }]}>
                    <MaterialCommunityIcons name="trash-can" size={18} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}, (prev, next) => {
    return prev.item.id === next.item.id && 
           prev.width === next.width &&
           prev.theme === next.theme &&
           JSON.stringify(prev.item.environments) === JSON.stringify(next.item.environments);
});

const styles = StyleSheet.create({
    mfitCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 15 },
    mfitThumbBox: { width: 70, height: 70, borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 15, position: 'relative' },
    mfitInfo: { flex: 1, justifyContent: 'center' },
    mfitTitle: { fontSize: 15, fontWeight: '800', flexWrap: 'wrap', marginBottom: 2 },
    mfitCategory: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 },
    tagsContainer: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
    envBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    envBadgeText: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
    mfitActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 },
    mfitActionBtn: { padding: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

export default ExerciseCard;