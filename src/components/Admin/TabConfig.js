// src/components/Admin/TabConfig.js
import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabConfig({ isMasterCoach, theme, navigation, flixName, setIsNpsModalOpen, setIsNoticeModalOpen, toggleDarkMode, selectThemeColor, selectedColor }) {
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

                {/* 🔥 CORES DE DESTAQUE RESTAURADAS 🔥 */}
                {!theme.isDark && (
                    <View style={{ width: '100%', marginTop: 10 }}>
                        <Text style={[styles.cardHeaderSmall, { marginBottom: 15, textAlign: 'left' }]}>COR DE DESTAQUE</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 5 }}>
                            <TouchableOpacity onPress={() => selectThemeColor('verde')} style={[styles.colorCircle, { backgroundColor: '#99CC00', borderColor: selectedColor === 'verde' ? theme.text : 'transparent' }]} />
                            <TouchableOpacity onPress={() => selectThemeColor('rosa')} style={[styles.colorCircle, { backgroundColor: '#FF2D55', borderColor: selectedColor === 'rosa' ? theme.text : 'transparent' }]} />
                            <TouchableOpacity onPress={() => selectThemeColor('roxo')} style={[styles.colorCircle, { backgroundColor: '#AF52DE', borderColor: selectedColor === 'roxo' ? theme.text : 'transparent' }]} />
                            <TouchableOpacity onPress={() => selectThemeColor('azul')} style={[styles.colorCircle, { backgroundColor: '#007AFF', borderColor: selectedColor === 'azul' ? theme.text : 'transparent' }]} />
                            <TouchableOpacity onPress={() => selectThemeColor('vermelho')} style={[styles.colorCircle, { backgroundColor: '#FF3B30', borderColor: selectedColor === 'vermelho' ? theme.text : 'transparent' }]} />
                        </View>
                    </View>
                )}
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
    colorCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
});