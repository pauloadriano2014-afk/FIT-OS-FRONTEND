import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabFeed({ theme, filteredFeed, visibleCountFeed, setVisibleCountFeed, handleDeleteLog }) {
    const renderFeedItem = (item) => {
        const date = new Date(item.date);
        const dayString = date.getDate() === new Date().getDate() ? `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : date.toLocaleDateString('pt-BR');
        return (
            <View key={item.id} style={[styles.feedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.iconBox, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="check-bold" size={20} color={theme.accent} /></View>
                <View style={{flex: 1}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                        <Text style={[styles.feedUser, { color: theme.text }]} numberOfLines={1}>{item.user?.name || "Aluno"}</Text>
                        <Text style={styles.feedTime}>{dayString}</Text>
                    </View>
                    <Text style={styles.feedAction}>Concluiu <Text style={{color: theme.accent, fontWeight:'bold'}}>{item.workoutName ? item.workoutName.toUpperCase() : "TREINO"}</Text></Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteLog(item.id)} style={{padding:5, marginLeft:5}}><MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} /></TouchableOpacity>
            </View>
        );
    };

    return (
        <>
            {filteredFeed.length === 0 ? <Text style={styles.empty}>Nada recente.</Text> : filteredFeed.slice(0, visibleCountFeed).map(renderFeedItem)}
            {visibleCountFeed < filteredFeed.length && (
                <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: theme.accent, backgroundColor: theme.accent + '15' }]} onPress={() => setVisibleCountFeed(p => p + 10)}>
                    <Text style={[styles.loadMoreText, { color: theme.accent }]}>CARREGAR MAIS</Text>
                </TouchableOpacity>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: '600' },
    feedCard: { padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    feedUser: { fontWeight: '900', fontSize: 14 }, feedTime: { color: '#888', fontSize: 10, fontWeight:'700' }, feedAction: { color: '#888', fontSize: 13, marginTop: 4 },
    loadMoreBtn: { padding: 16, marginVertical: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
    loadMoreText: { fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});