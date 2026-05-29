import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getRpeInfo } from '../utils/calculations';

export default function WorkoutLogCard({ item, theme }) {
    const rpeInfo = item.rpe ? getRpeInfo(item.rpe) : null;
    
    return (
        <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.logHeader}>
                <View>
                    <Text style={[styles.logTitle, { color: theme.text }]}>{item.name}</Text>
                    <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString()} • {item.duration || 60} min</Text>
                </View>
                {rpeInfo && (
                    <View style={{alignItems:'flex-end'}}>
                        <View style={[styles.rpeBadge, {backgroundColor: rpeInfo.color}]}>
                            <Text style={styles.rpeVal}>{item.rpe}</Text>
                        </View>
                        <Text style={[styles.rpeLabelName, {color: rpeInfo.color}]}>{rpeInfo.label}</Text>
                    </View>
                )}
            </View>
            
            {item.feedback ? (
                <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:5, marginBottom:5}}>
                        <MaterialCommunityIcons name="text-box-outline" size={14} color={theme.textSecondary} />
                        <Text style={styles.feedbackLabel}>OBSERVAÇÃO DO ALUNO:</Text>
                    </View>
                    <Text style={[styles.feedbackText, { color: theme.text }]}>{item.feedback}</Text>
                </View>
            ) : (
                <View style={[styles.feedbackContainer, { opacity:0.5, backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={styles.noFeedback}>Sem observações.</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    logCard: { padding:15, borderRadius:12, marginBottom:15, borderWidth:1 },
    logHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
    logTitle: { fontSize:14, fontWeight:'bold', marginBottom:4 },
    logDate: { color:'#888', fontSize:10 },
    rpeBadge: { alignItems:'center', justifyContent:'center', borderRadius:6, width:24, height:24, alignSelf:'flex-end' },
    rpeVal: { fontWeight:'900', fontSize:12, color:'#000' }, 
    rpeLabelName: { fontSize:8, fontWeight:'bold', marginTop:2, textAlign:'right' },
    feedbackContainer: { padding:12, borderRadius:8, marginTop:5 },
    feedbackLabel: { color:'#888', fontSize:9, fontWeight:'bold' },
    feedbackText: { fontSize:13, fontStyle:'italic', lineHeight: 18 },
    noFeedback: { color:'#888', fontSize:12, fontStyle:'italic' },
});