import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabConfig({ isMasterCoach, theme, navigation, flixName, setIsNpsModalOpen, setIsNoticeModalOpen, toggleDarkMode }) {
    return (
        <>
            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#BF5AF2' }]} onPress={() => navigation.navigate('AdminAddContent')}>
                <View style={[styles.iconCircle, {backgroundColor: '#BF5AF2'}]}><MaterialCommunityIcons name="video-plus" size={32} color="#FFF" /></View>
                <Text style={[styles.bigCardTitle, {color: '#BF5AF2'}]}>{flixName} ADMIN</Text>
                <Text style={styles.bigCardDesc}>Adicionar novos conteúdos e vídeos de suporte.</Text>
            </TouchableOpacity>

            {isMasterCoach && (
                <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => setIsNpsModalOpen(true)}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="star-face" size={24} color="#4DE38F" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#4DE38F'}]}>PESQUISA NPS</Text></View>
                    <Text style={[styles.bigCardDesc, {marginTop:5}]}>Selecione alunos e dispare a pesquisa de satisfação no aplicativo deles.</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#32ADE6' }]} onPress={() => setIsNoticeModalOpen(true)}>
                <View style={{flexDirection:'row', alignItems:'center', gap:10}}><MaterialCommunityIcons name="bullhorn" size={24} color="#32ADE6" /><Text style={[styles.bigCardTitle, {marginBottom:0, color:'#32ADE6'}]}>ENVIAR AVISO</Text></View>
                <Text style={[styles.bigCardDesc, {marginTop:5}]}>Notifique todos ou um aluno específico.</Text>
            </TouchableOpacity>

            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 20 }]}>
                <Text style={styles.cardHeaderSmall}>APARÊNCIA DO PAINEL</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15, width: '100%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><MaterialCommunityIcons name={theme.isDark ? "moon-waning-crescent" : "white-balance-sunny"} size={24} color={theme.text} /><Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Modo Escuro</Text></View>
                    <Switch value={theme.isDark} onValueChange={toggleDarkMode} trackColor={{ false: '#ccc', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (theme.isDark ? '#FFF' : '#f4f3f4')} />
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', width: '100%', marginBottom: 15 }, 
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    bigCardDesc: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
    cardHeaderSmall: { color:'#888', fontWeight:'bold', fontSize:12, letterSpacing: 1 },
});