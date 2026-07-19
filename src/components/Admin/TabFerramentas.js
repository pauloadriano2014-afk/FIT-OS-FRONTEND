// src/components/Admin/TabFerramentas.js — v2
// v2: card GESTÃO DE COACHES visível só para Paulo (não Adri, não parceiros)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Paulo = master não-Adri
const PAULO_ID = '3c82f763-66b4-48da-836e-16817d4f57c0';

export default function TabFerramentas({ isMasterCoach, theme, navigation, alunosAtivos, currentUserId }) {
    const isPaulo = currentUserId === PAULO_ID;

    return (
        <>
            {/* GESTÃO DE COACHES — só Paulo ← v2 */}
            {isPaulo && (
                <TouchableOpacity
                    style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#32ADE6', borderWidth: 2 }]}
                    onPress={() => navigation.navigate('AdminCoachesScreen')}
                >
                    <View style={[styles.iconCircle, { backgroundColor: '#32ADE622' }]}>
                        <MaterialCommunityIcons name="account-tie" size={32} color="#32ADE6" />
                    </View>
                    <Text style={[styles.bigCardTitle, { color: '#32ADE6' }]}>GESTÃO DE COACHES</Text>
                    <Text style={styles.bigCardDesc}>
                        Aprove, bloqueie e defina o plano dos coaches parceiros (Personal, Nutricionista ou Elite).
                    </Text>
                </TouchableOpacity>
            )}

            {/* Prescrição IA — só master */}
            {isMasterCoach && (
                <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.accent, borderWidth: 2 }]} onPress={() => navigation.navigate('LaboratoryScreen')}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.accent + '22' }]}><MaterialCommunityIcons name="flask-outline" size={32} color={theme.accent} /></View>
                    <Text style={[styles.bigCardTitle, { color: theme.accent }]}>PRESCRIÇÃO IA</Text>
                    <Text style={styles.bigCardDesc}>Laboratório inteligente para montagem de treinos com algoritmos.</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('BibliotecaAdmin')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}><MaterialCommunityIcons name="database-edit" size={32} color={theme.accent} /></View>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>EXERCÍCIOS</Text>
                <Text style={styles.bigCardDesc}>Gerencie a biblioteca.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('GerenciarTemplates')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="folder-multiple" size={32} color={theme.isDark ? '#000' : '#FFF'} /></View>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>MEUS TEMPLATES</Text>
                <Text style={styles.bigCardDesc}>Crie fichas de treino padrão.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminTechniquesScreen')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}><MaterialCommunityIcons name="puzzle-outline" size={32} color={theme.accent} /></View>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>TÉCNICAS AVANÇADAS</Text>
                <Text style={styles.bigCardDesc}>Crie combos e sequências de execução (Drops, Rest, etc).</Text>
            </TouchableOpacity>

            {/* 🔥 NOVO: CONSTRUTOR DE ANAMNESE SAAS 🔥 */}
            <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminAnamneseBuilderScreen')}>
                <View style={[styles.iconCircle, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}><MaterialCommunityIcons name="clipboard-edit-outline" size={32} color={theme.accent} /></View>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>FORMULÁRIOS E ANAMNESE</Text>
                <Text style={styles.bigCardDesc}>Personalize as perguntas dos seus questionários de Treino e Dieta.</Text>
            </TouchableOpacity>

            {isMasterCoach && (
                <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminDietLibraryScreen')}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }]}><MaterialCommunityIcons name="food-apple" size={32} color={theme.accent} /></View>
                    <Text style={[styles.bigCardTitle, { color: theme.text }]}>COFRE DE DIETAS</Text>
                    <Text style={styles.bigCardDesc}>Gerencie templates alimentares.</Text>
                </TouchableOpacity>
            )}

            {isMasterCoach && (
                <TouchableOpacity style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: '#4DE38F', borderWidth: 2 }]} onPress={() => navigation.navigate('AdminIALabScreen')}>
                    <View style={[styles.iconCircle, { backgroundColor: '#4DE38F22' }]}><MaterialCommunityIcons name="brain" size={32} color="#4DE38F" /></View>
                    <Text style={[styles.bigCardTitle, { color: '#4DE38F' }]}>LABORATÓRIO IA</Text>
                    <Text style={styles.bigCardDesc}>Análise avulsa de fotos e shape.</Text>
                </TouchableOpacity>
            )}

            {isMasterCoach && (
                <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 15 }}>
                        <Text style={styles.cardHeaderSmall}>RANKING DE XP</Text>
                        <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
                    </View>
                    {[...alunosAtivos].sort((a, b) => (b.currentXP || 0) - (a.currentXP || 0)).slice(0, 3).map((a, i) => (
                        <View key={a.id} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 5 }}>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>{i + 1}. {a.name || 'Aluno'}</Text>
                            <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{a.currentXP || 0} XP</Text>
                        </View>
                    ))}
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    bigCard:         { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', width: '100%', marginBottom: 15 },
    iconCircle:      { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    bigCardTitle:    { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    bigCardDesc:     { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
    cardHeaderSmall: { color: '#888', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
});