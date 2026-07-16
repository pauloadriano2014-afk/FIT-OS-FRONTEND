// src/components/Admin/AdminStudentCard.js
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExpirationStatus, getCheckinStatus, getPlanBadge } from '../../utils/adminHelpers';

export default function AdminStudentCard({ item, theme, navigation }) {
    const activeWorkout = (item.workouts && item.workouts.length > 0) ? item.workouts[0] : null;
    const farol = getExpirationStatus(activeWorkout);
    const isCheckinLate = getCheckinStatus(item); 
    const primeiraLetra = item.name ? item.name.charAt(0).toUpperCase() : 'A';
    
    const dbPlan = item.plan || 'PREMIUM';
    const badge = getPlanBadge(dbPlan);
    const pendingCount = item._count?.checkIns || 0;

    const isDark = !!theme.isDark;
    
    // 🔥 LÓGICA DE ALINHAMENTO SEMANAL (CRM) 🔥
    const isContactDelayed = item.lastContactDate 
        ? Math.floor((new Date().getTime() - new Date(item.lastContactDate).getTime()) / (1000 * 3600 * 24)) >= 7 
        : true;

    // 🔥 VARIÁVEIS DOS GATILHOS DE INTENSIDADE E CICLO 🔥
    const isMenstruating = item.isMenstruating || false;
    const intensityMultiplier = activeWorkout?.intensityMultiplier || 1;
    const hasDeload = intensityMultiplier < 1;
    const hasChoque = intensityMultiplier > 1;

    const handleCobrarWhatsApp = (e) => {
        e.stopPropagation(); 
        const nomePrimeiro = item.name ? item.name.split(' ')[0] : 'Aluno';
        let phone = item.phone || '';
        phone = phone.replace(/\D/g, '');
        
        if (!phone || phone.length < 10) {
            const msg = "O aluno não possui um número de celular válido cadastrado.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Ops", msg);
            return;
        }
        
        if (!phone.startsWith('55')) phone = `55${phone}`;

        const mensagem = `Fala, ${nomePrimeiro}! Tudo certo? 👊\n\nPassando aqui porque o meu painel me avisou que o seu check-in com as fotos está pendente.\n\nConsegue me mandar hoje para eu avaliar sua evolução, te dar aquele feedback detalhado e já atualizar a nossa estratégia para os próximos dias?\n\nBora pra cima! 🔥`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagem)}`;
        
        Linking.openURL(url).catch(() => {
            const erro = "Não foi possível abrir o WhatsApp.";
            if (Platform.OS === 'web') window.alert(erro); else Alert.alert("Erro", erro);
        });
    };

    // 🔥 ESTILOS DO CARD: visual novo só no dark mode; light mode mantém o original (theme.*)
    const cardStyle = isDark
        ? [styles.card, styles.cardDark, pendingCount > 0 ? styles.cardDarkAlert : styles.cardDarkDefault]
        : [styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: pendingCount > 0 ? 2 : 1 }];

    const avatarPlaceholderStyle = isDark
        ? [styles.avatarPlaceholder, styles.avatarPlaceholderDark]
        : [styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }];

    const avatarTextStyle = isDark
        ? [styles.avatarText, { color: '#E5E5EA' }]
        : [styles.avatarText, { color: theme.accent }];

    const alunoNameStyle = isDark
        ? [styles.alunoName, { color: '#F2F2F7' }]
        : [styles.alunoName, { color: theme.text }];

    return (
        <TouchableOpacity 
            activeOpacity={0.75}
            style={cardStyle}
            onPress={() => navigation.navigate('AdminAlunoOptions', { aluno: item, alunoId: item.id })}
        > 
            {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={[styles.avatar, isDark && styles.avatarDark]} />
            ) : (
                <View style={avatarPlaceholderStyle}>
                    <Text style={avatarTextStyle}>{primeiraLetra}</Text>
                </View>
            )}
            
            <View style={{ flex: 1, marginLeft: isDark ? 14 : 15, justifyContent: 'center' }}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: isDark ? 6 : 2}}>
                    <Text style={alunoNameStyle} numberOfLines={1}>{item.name || 'Aluno Sem Nome'}</Text>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: isDark ? 0 : 2, flexWrap: 'wrap'}}>
                    <View style={[styles.badgeBase, { backgroundColor: badge.color + (isDark ? '33' : '22'), borderColor: isDark ? badge.color + '55' : undefined, borderWidth: isDark ? 1 : 0 }]}>
                        <MaterialCommunityIcons name={badge.icon} size={10} color={badge.color} />
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>

                    {/* 🔥 SELO DE ALINHAMENTO SEMANAL 🔥 */}
                    {isContactDelayed && (
                        <View style={[styles.badgeBase, { backgroundColor: isDark ? '#8B5CF633' : '#8B5CF622', borderColor: '#8B5CF6', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="forum-outline" size={10} color={isDark ? '#A78BFA' : '#8B5CF6'} />
                            <Text style={[styles.badgeText, { color: isDark ? '#C4B5FD' : '#8B5CF6', fontWeight: '900' }]}>
                                ALINHAR SEMANAL
                            </Text>
                        </View>
                    )}

                    {isMenstruating && (
                        <View style={[styles.badgeBase, { backgroundColor: hasDeload ? (isDark ? '#4DE38F33' : '#4DE38F22') : (isDark ? '#FF3B3033' : '#FF3B3022'), borderColor: hasDeload ? '#4DE38F' : '#FF3B30', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name={hasDeload ? "shield-check" : "water-alert"} size={10} color={hasDeload ? "#4DE38F" : (isDark ? "#FF6961" : "#FF3B30")} />
                            <Text style={[styles.badgeText, { color: hasDeload ? (isDark ? "#7CF0AE" : "#4DE38F") : (isDark ? "#FF6961" : "#FF3B30") }]}>{hasDeload ? 'DELOAD MENSTRUAL' : 'PROTOCOLO MENSTRUAL'}</Text>
                        </View>
                    )}

                    {!isMenstruating && hasDeload && (
                        <View style={[styles.badgeBase, { backgroundColor: isDark ? '#32ADE633' : '#32ADE622', borderColor: '#32ADE6', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="shield-half-full" size={10} color={isDark ? "#5EC2EF" : "#32ADE6"} />
                            <Text style={[styles.badgeText, { color: isDark ? "#5EC2EF" : "#32ADE6" }]}>DELOAD ATIVO</Text>
                        </View>
                    )}

                    {hasChoque && (
                        <View style={[styles.badgeBase, { backgroundColor: isDark ? '#FF950033' : '#FF950022', borderColor: '#FF9500', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name="lightning-bolt" size={10} color={isDark ? "#FFB143" : "#FF9500"} />
                            <Text style={[styles.badgeText, { color: isDark ? "#FFB143" : "#FF9500" }]}>SEMANA DE CHOQUE</Text>
                        </View>
                    )}

                    {pendingCount > 0 && (
                        <View style={[styles.badgeBase, { backgroundColor: isDark ? '#FF3B3033' : '#FF3B3022', borderColor: isDark ? '#FF3B30' : undefined, borderWidth: isDark ? 1 : 0 }]}>
                            <MaterialCommunityIcons name="alert-circle" size={10} color={isDark ? "#FF6961" : "#FF3B30"} />
                            <Text style={[styles.badgeText, { color: isDark ? "#FF6961" : "#FF3B30" }]}>{pendingCount} AVALIAÇ{pendingCount > 1 ? 'ÕES' : 'ÃO'} PENDENTE{pendingCount > 1 ? 'S' : ''}</Text>
                        </View>
                    )}

                    {isCheckinLate && (
                        <TouchableOpacity style={styles.zapBtn} onPress={handleCobrarWhatsApp}>
                            <MaterialCommunityIcons name="whatsapp" size={12} color="#25D366" />
                            <Text style={[styles.badgeText, { color: '#FFF' }]}>COBRAR FOTOS</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={{ alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 }}>
                {farol && (
                    <View style={[styles.farolBadge, { backgroundColor: farol.bg === 'rgba(52, 199, 89, 0.15)' ? '#34C759' : farol.bg }]}>
                        <Text style={[styles.farolText, { color: farol.bg === 'rgba(52, 199, 89, 0.15)' ? '#FFF' : farol.color }]}>{farol.text}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { padding: 16, borderRadius: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', cursor: 'pointer' },

    // Visual novo — aplicado apenas quando theme.isDark === true
    cardDark: {
        borderRadius: 18,
        marginBottom: 12,
        backgroundColor: '#1C1C1E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    cardDarkDefault: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardDarkAlert: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,59,48,0.55)',
    },

    avatarPlaceholder: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarPlaceholderDark: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#2C2C2E',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    avatar: { width: 45, height: 45, borderRadius: 25 },
    avatarDark: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    avatarText: { fontWeight: 'bold', fontSize: 18 },
    alunoName: { fontWeight: 'bold', fontSize: 16 },
    badgeBase: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 9, fontWeight: '900' },
    zapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#25D366' },
    farolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    farolText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }
});