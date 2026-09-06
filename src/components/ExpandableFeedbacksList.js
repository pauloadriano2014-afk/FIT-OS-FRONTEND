import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FeedbackCard from './FeedbackCard';

export default function ExpandableFeedbacksList({ feedbacks }) {
    const [expanded, setExpanded] = useState(false);
    const visibleFeedbacks = expanded ? feedbacks : feedbacks.slice(0, 3);

    return (
        <View style={styles.container}>
            <View style={styles.list}>
                {visibleFeedbacks.map((fb, index) => (
                    <FeedbackCard key={index} uri={fb.uri} legend={fb.legend} />
                ))}
            </View>

            {!expanded && feedbacks.length > 3 && (
                <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(true)}>
                    <Text style={styles.expandText}>Ver mais feedbacks</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color="#4DE38F" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', alignItems: 'center' },
    list: { width: '100%', gap: 20 },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(77, 227, 143, 0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(77, 227, 143, 0.3)',
        gap: 8
    },
    expandText: { color: '#4DE38F', fontWeight: 'bold', fontSize: 14 }
});