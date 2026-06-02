// src/components/AdminWorkoutLogsTab.js
import React from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import WorkoutLogCard from './WorkoutLogCard';

export default function AdminWorkoutLogsTab({ workoutLogs, theme }) {
    return (
        <FlatList 
            data={workoutLogs}
            keyExtractor={item => item.id}
            renderItem={({item}) => <WorkoutLogCard item={item} theme={theme} />}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum treino finalizado.</Text>}
        />
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 50 },
    empty: { color: '#888', textAlign: 'center', marginTop: 50, fontWeight: 'bold' }
});