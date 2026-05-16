// src/components/MontarTreino/VideoListCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const getDirectImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
        const match = url.match(/[-\w]{25,}/);
        if (match && match[0]) return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w1000`;
    }
    return url;
};

export default function VideoListCard({ 
    item, theme, openAdminComments, handleOpenAccessModal, 
    handleEdit, handleDelete 
}) {
    const iconName = item.type === 'ebook' ? 'book-open-variant' : (item.type === 'audio' ? 'headphones' : 'video');
    
    return (
        <View style={[styles.listItemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            <Image 
                source={getDirectImageUrl(item.thumbUrl) || 'https://via.placeholder.com/100'}
                style={[styles.listThumb, { borderColor: theme.border, borderWidth: 1 }]} 
                contentFit="cover"
                transition={200}
                cachePolicy="disk" 
            />
            
            <View style={styles.listInfo}>
                <Text style={[styles.listTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
                <View style={styles.listTagsRow}>
                    <View style={[styles.listTag, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name={iconName} size={10} color={theme.isDark ? '#000' : '#FFF'} /><Text style={[styles.listTagText, { color: theme.isDark ? '#000' : '#FFF' }]}>{item.type?.toUpperCase() || 'VIDEO'}</Text></View>
                    {item.isVIP && <View style={[styles.listTag, { backgroundColor: '#FFCC00' }]}><MaterialCommunityIcons name="lock" size={10} color="#000" /><Text style={[styles.listTagText, { color: '#000' }]}>VIP</Text></View>}
                </View>
            </View>

            <View style={styles.listActions}>
                <TouchableOpacity onPress={() => openAdminComments(item)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <MaterialCommunityIcons name="comment-text-multiple-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {item.isVIP && (
                    <TouchableOpacity onPress={() => handleOpenAccessModal(item)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: '#FFCC00', borderWidth: 1 }]}>
                        <MaterialCommunityIcons name="key-variant" size={20} color="#FFCC00" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <MaterialCommunityIcons name="pencil" size={20} color="#32ADE6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <MaterialCommunityIcons name="trash-can" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    listItemCard: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, alignItems: 'center' },
    listThumb: { width: 50, height: 70, borderRadius: 8 },
    listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    listTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
    listTagsRow: { flexDirection: 'row', gap: 6 },
    listTag: { flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, alignItems: 'center', gap: 4 },
    listTagText: { fontSize: 9, fontWeight: '900' },
    
    // 🔥 CORREÇÃO: Limite de largura e quebra de linha para não esmagar no mobile 🔥
    listActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, marginLeft: 10, width: 85 },
    actionBtn: { padding: 6, borderRadius: 8 }
});