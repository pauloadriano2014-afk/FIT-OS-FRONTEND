// src/components/AdminCheckinTab.js
import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import CheckinCard from './CheckinCard';

export default function AdminCheckinTab({ checkinHistory, theme, onOpenCheckinDetails }) {
    return (
        <FlatList 
            data={checkinHistory}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
                <CheckinCard 
                    item={item} 
                    theme={theme} 
                    onPress={() => onOpenCheckinDetails(item)} 
                />
            )}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum check-in enviado.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 50 },
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: 'bold' }
});