// src/components/Admin/AdminUserAccessTab.js
import React from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminUserAccessTab({
    theme,
    userPlan,
    confirmChangePlan,
    loadingPaflix,
    vipContents,
    userAccess,
    handleToggleAccess
}) {
    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>ESTEIRA DE PRODUTOS E ACESSOS</Text>
            <Text style={[styles.sectionSubDesc, { marginBottom: 15 }]}>Defina qual plano e quais bônus do PA Flix este aluno comprou.</Text>

            <View style={styles.plansContainer}>
                <TouchableOpacity style={[styles.planCard, userPlan === 'ELITE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('ELITE')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="crown" size={18} color={userPlan === 'ELITE' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'ELITE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>ELITE (TREINO E DIETA)</Text></View>
                    {userPlan === 'ELITE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.planCard, userPlan === 'PERFORMANCE' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PERFORMANCE')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="weight-lifter" size={18} color={userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'PERFORMANCE' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PERFORMANCE (SÓ TREINO)</Text></View>
                    {userPlan === 'PERFORMANCE' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.planCard, userPlan === 'PREMIUM' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('PREMIUM')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="star-circle" size={18} color={userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PREMIUM (ANTIGO)</Text></View>
                    {userPlan === 'PREMIUM' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.planCard, userPlan === 'FICHA8S' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('FICHA8S')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="lightning-bolt" size={18} color={userPlan === 'FICHA8S' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'FICHA8S' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>FICHA 8 SEMANAS</Text></View>
                    {userPlan === 'FICHA_8S' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.planCard, userPlan === 'LOWCOST' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('LOWCOST')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="rocket-launch" size={18} color={userPlan === 'LOWCOST' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'LOWCOST' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>PLANO BÁSICO</Text></View>
                    {userPlan === 'LOW_COST' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.planCard, userPlan === 'CHALLENGE21' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => confirmChangePlan('CHALLENGE21')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}><MaterialCommunityIcons name="fire" size={18} color={userPlan === 'CHALLENGE21' ? theme.accent : theme.textSecondary} /><Text style={[styles.planTitle, { color: userPlan === 'CHALLENGE21' ? theme.accent : theme.textSecondary }]} numberOfLines={2}>DESAFIO 21 DIAS</Text></View>
                    {userPlan === 'CHALLENGE_21' && <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PERMISSÕES DE BÔNUS (PA FLIX)</Text>
            {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} /> : (
                vipContents.length === 0 ? (
                    <View style={[styles.emptyBox, { borderColor: theme.border }]}><MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} /><Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado.</Text></View>
                ) : (
                    vipContents.map(content => {
                        const hasAccess = userAccess.includes(content.id);
                        const iconName = content.type === 'ebook' ? 'book-open-variant' : (content.type === 'audio' ? 'headphones' : 'video');
                        return (
                            <View key={content.id} style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.iconBox, { backgroundColor: theme.bg }]}><MaterialCommunityIcons name={iconName} size={24} color={hasAccess ? theme.accent : theme.textSecondary} /></View>
                                <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}><Text style={[styles.accessTitle, { color: theme.text }]}>{content.title}</Text><Text style={styles.accessCategory}>{content.category}</Text></View>
                                <Switch value={hasAccess} onValueChange={() => handleToggleAccess(content.id, hasAccess)} trackColor={{ false: '#333', true: theme.accent }} thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? '#000' : '#888')} />
                            </View>
                        )
                    })
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: { width: '100%', paddingBottom: 20 },
    sectionLabel: { color: '#888', fontWeight: '900', marginBottom: 15, fontSize: 12, letterSpacing: 1 },
    sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
    plansContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
    planCard: { width: '48%', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitle: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5, flexShrink: 1 },
    accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },
    emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 16, borderStyle: 'dashed' },
    emptyText: { color: '#888', marginTop: 10, fontWeight: 'bold', fontSize: 12 }
});