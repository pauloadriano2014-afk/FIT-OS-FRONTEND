// src/components/Admin/AdminUserAccessTab.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 IDs MASTER PARA COORDENAR NOMENCLATURAS E LIBERAÇÃO COMPLETA
const MASTER_IDS = [
    '3c82f763-66b4-48da-836e-16817d4f57c0', // Paulo
    'b7c0c181-41fd-4156-b8fe-963a267759a3'  // Adri
];

export default function AdminUserAccessTab({
    theme,
    userPlan,
    confirmChangePlan,
    loadingPaflix,
    vipContents,
    userAccess,
    handleToggleAccess
}) {
    const [safeIsMaster, setSafeIsMaster] = useState(false);
    const [adminId, setAdminId] = useState(null);
    const [isCheckingSecurity, setIsCheckingSecurity] = useState(true);

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const userObj = JSON.parse(userJson);
                    setSafeIsMaster(MASTER_IDS.includes(userObj.id));
                    setAdminId(userObj.id); // 🔥 Guardamos a identidade do Coach
                }
            } catch (e) {
                console.log("Erro ao verificar master em Acessos:", e);
            } finally {
                setIsCheckingSecurity(false);
            }
        };
        verifyAccess();
    }, []);

    if (isCheckingSecurity) {
        return (
            <View style={[styles.tabContent, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    // 🔥 FILTRO BLINDADO NO FRONT-END 🔥
    // Se a API mandar lixo ou estiver desatualizada, o front-end corta o mal pela raiz.
    // Master vê tudo. Parceiro vê APENAS o conteúdo que tem o coachId dele.
    const visibleVipContents = safeIsMaster 
        ? vipContents 
        : vipContents.filter(content => content.coachId === adminId);

    // 🔥 MAPEA E EXPLICA OS PLANOS DE ACORDO COM QUEM ESTÁ LOGADO
    const getVisiblePlans = () => {
        if (safeIsMaster) {
            return [
                { id: 'ELITE', icon: 'crown', title: 'ELITE (TREINO E DIETA)', desc: 'Acesso total do aluno a planilhas personalizadas de treinamento e ao módulo completo de sugestões alimentares.' },
                { id: 'PERFORMANCE', icon: 'weight-lifter', title: 'PERFORMANCE (SÓ TREINO)', desc: 'Acesso exclusivo às rotinas de treinamento físico prescritas.' },
                { id: 'PREMIUM', icon: 'star-circle', title: 'PREMIUM (ANTIGO)', desc: 'Versão legada do sistema (Mesmos parâmetros estruturais do Elite).' },
                { id: 'FICHA8S', icon: 'lightning-bolt', title: 'FICHA 8 SEMANAS', desc: 'Estrutura fechada com contagem regressiva automática e bloqueio em 56 dias.' },
                { id: 'LOWCOST', icon: 'rocket-launch', title: 'PLANO BÁSICO', desc: 'Entrega enxuta voltada para o modelo start do aplicativo.' },
                { id: 'CHALLENGE21', icon: 'fire', title: 'DESAFIO 21 DIAS', desc: 'Protocolo de alta frequência e engajamento travado no ciclo de 3 semanas.' }
            ];
        } else {
            // Coach parceiro
            return [
                { id: 'PERFORMANCE', icon: 'weight-lifter', title: 'CONSULTORIA DE TREINO', desc: 'Plano focado na prescrição completa das planilhas de exercícios personalizadas.' },
                { id: 'FICHA8S', icon: 'lightning-bolt', title: 'FICHA 8 SEMANAS', desc: 'Programa de treinamento com ciclo pré-fixado de 2 meses (Bloqueio automático após 56 dias).' },
                { id: 'CHALLENGE21', icon: 'fire', title: 'DESAFIO 21 DIAS', desc: 'Protocolo intensivo e de tiro curto com duração total de 3 semanas.' },
                { id: 'LOWCOST', icon: 'rocket-launch', title: 'TREINO BÁSICO', desc: 'Rotina de treino de menor custo, simplificada no sistema.' }
            ];
        }
    };

    const plansToRender = getVisiblePlans();

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionLabel}>ESTEIRA DE PRODUTOS E ACESSOS</Text>
            <Text style={[styles.sectionSubDesc, { marginBottom: 15 }]}>Defina qual plano e quais bônus do aplicativo este aluno comprou.</Text>

            <View style={styles.plansContainer}>
                {plansToRender.map(opt => {
                    const isSelected = userPlan === opt.id || (opt.id === 'FICHA8S' && userPlan === 'FICHA_8S') || (opt.id === 'LOWCOST' && userPlan === 'LOW_COST') || (opt.id === 'CHALLENGE21' && userPlan === 'CHALLENGE_21');
                    
                    return (
                        <TouchableOpacity 
                            key={opt.id} 
                            style={[
                                styles.planCard, 
                                isSelected ? { backgroundColor: theme.accent + '15', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }
                            ]} 
                            onPress={() => confirmChangePlan(opt.id)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                                <View style={[styles.iconBoxSmall, { backgroundColor: isSelected ? theme.accent + '22' : theme.bg }]}>
                                    <MaterialCommunityIcons name={opt.icon} size={18} color={isSelected ? theme.accent : theme.textSecondary} />
                                </View>
                                <View style={{ flex: 1, paddingRight: 5 }}>
                                    <Text style={[styles.planTitle, { color: isSelected ? theme.accent : theme.text }]}>{opt.title}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 }}>{opt.desc}</Text>
                                </View>
                            </View>
                            {isSelected && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PERMISSÕES DE BÔNUS (PA FLIX)</Text>
            {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} /> : (
                visibleVipContents.length === 0 ? (
                    <View style={[styles.emptyBox, { borderColor: theme.border }]}><MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} /><Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado.</Text></View>
                ) : (
                    visibleVipContents.map(content => {
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
    
    plansContainer: { flexDirection: 'column', gap: 10, marginBottom: 10 },
    planCard: { width: '100%', padding: 15, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    planTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
    iconBoxSmall: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    
    accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },
    emptyBox: { padding: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 16, borderStyle: 'dashed' },
    emptyText: { color: '#888', marginTop: 10, fontWeight: 'bold', fontSize: 12 }
});