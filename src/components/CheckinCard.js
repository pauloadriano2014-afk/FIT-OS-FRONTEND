import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CheckinCard({ item, theme, onPress }) {
    return (
        <TouchableOpacity 
            style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={onPress}
        >
            <View style={styles.logHeader}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                    <View style={[styles.rpeBadge, {backgroundColor: 'rgba(50, 173, 230, 0.2)', width:36, height:36}]}>
                        <MaterialCommunityIcons name="camera-outline" size={20} color="#32ADE6" />
                    </View>
                    <View>
                        <Text style={[styles.logTitle, {color:'#32ADE6'}]}>CHECK-IN SEMANAL</Text>
                        <Text style={styles.logDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                    </View>
                </View>
                <Text style={{color: theme.text, fontWeight:'bold', fontSize:16}}>{item.weight ? `${item.weight} kg` : ''}</Text>
            </View>
            
            {item.feedback && (
                <View style={[styles.feedbackContainer, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.feedbackText, { color: theme.text }]} numberOfLines={2}>"{item.feedback}"</Text>
                </View>
            )}
            <View style={{alignItems:'center', marginTop:10}}>
                <Text style={{color: theme.textSecondary, fontSize:10, fontWeight:'bold'}}>TOQUE PARA VER FOTOS &gt;</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    logCard: { padding:15, borderRadius:12, marginBottom:15, borderWidth:1 },
    logHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
    logTitle: { fontSize:14, fontWeight:'bold', marginBottom:4 },
    logDate: { color:'#888', fontSize:10 },
    rpeBadge: { alignItems:'center', justifyContent:'center', borderRadius:6, width:24, height:24, alignSelf:'flex-end' },
    feedbackContainer: { padding:12, borderRadius:8, marginTop:5 },
    feedbackText: { fontSize:13, fontStyle:'italic', lineHeight: 18 },
});