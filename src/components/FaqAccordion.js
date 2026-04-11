// src/components/FaqAccordion.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function FaqAccordion({ faqs }) {
    const [expandedIndex, setExpandedIndex] = useState(null);

    return (
        <View style={styles.faqContainer}>
            {faqs.map((faq, index) => {
                const isExpanded = expandedIndex === index;
                return (
                    <View key={index} style={styles.faqItem}>
                        <TouchableOpacity 
                            style={styles.faqHeader} 
                            onPress={() => setExpandedIndex(isExpanded ? null : index)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.faqQuestion}>{faq.q}</Text>
                            <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#4DE38F" />
                        </TouchableOpacity>
                        {isExpanded && (
                            <View style={styles.faqBody}>
                                <Text style={styles.faqAnswer}>{faq.a}</Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    faqContainer: { width: '100%', paddingHorizontal: 5, marginBottom: 40 },
    faqItem: { backgroundColor: '#161616', borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#333', overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
    faqQuestion: { color: '#FFF', fontSize: 15, fontWeight: 'bold', flex: 1, paddingRight: 15 },
    faqBody: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#222' },
    faqAnswer: { color: '#BBB', fontSize: 14, lineHeight: 22 }
});