// src/components/AssessmentHistoryCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AssessmentHistoryCard({ item, theme, onOpenDetails, onDelete }) {
    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.date, { color: theme.text }]}>{new Date(item.date).toLocaleDateString()}</Text>
                <View style={{flexDirection:'row', gap:10}}>
                    <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                        <Text style={styles.badgeText}>{item.method === 'POLLOCK' ? 'POLLOCK' : 'BÁSICO'}</Text>
                    </View>
                    
                    {/* Botão de Excluir Isolado */}
                    <TouchableOpacity onPress={onDelete} style={{paddingHorizontal: 8, zIndex: 10}}>
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* 🔥 A área de baixo inteira é o botão que abre os Detalhes 🔥 */}
            <TouchableOpacity style={styles.cardBody} onPress={onOpenDetails} activeOpacity={0.5}>
                <View style={styles.stat}>
                    <Text style={styles.label}>PESO</Text>
                    <Text style={[styles.val, { color: theme.text }]}>{item.weight}kg</Text>
                </View>
                {item.bodyFat ? (
                    <View style={styles.stat}>
                        <Text style={styles.label}>GORDURA</Text>
                        <Text style={[styles.val, {color: theme.accent}]}>{item.bodyFat}%</Text>
                    </View>
                ) : null}
                {item.waist ? (
                    <View style={styles.stat}>
                        <Text style={styles.label}>CINTURA</Text>
                        <Text style={[styles.val, { color: theme.text }]}>{item.waist}cm</Text>
                    </View>
                ) : null}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { padding:15, borderRadius:12, marginBottom:10, borderWidth:1 },
    cardHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
    date: { fontWeight:'bold' },
    badge: { paddingHorizontal:6, paddingVertical: 2, borderRadius:4, marginRight:10, justifyContent: 'center' },
    badgeText: { color:'#888', fontSize:10, fontWeight:'bold' },
    cardBody: { flexDirection:'row', gap:20, marginTop: 5 },
    stat: { alignItems:'flex-start' },
    label: { color:'#888', fontSize:10, fontWeight:'bold' },
    val: { fontSize:16, fontWeight:'bold' },
});