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
    
    const dbPlan = ['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(item.plan) ? item.plan : 'PREMIUM';
    const badge = getPlanBadge(dbPlan);
    const pendingCount = item._count?.checkIns || 0;
    
    // 🔥 VARIÁVEL PARA LER O STATUS MENSTRUAL 🔥
    const isMenstruating = item.isMenstruating || false;
    const hasDeload = activeWorkout && activeWorkout.intensityMultiplier < 1;

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

    return (
        <TouchableOpacity 
            style={[styles.card, { backgroundColor: theme.surface, borderColor: pendingCount > 0 ? '#FF3B30' : theme.border, borderWidth: pendingCount > 0 ? 2 : 1 }]} 
            onPress={() => navigation.navigate('AdminAlunoOptions', { aluno: item, alunoId: item.id })}
        > 
            {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={[styles.avatarPlaceholder, { borderWidth: 0 }]} />
            ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.avatarText, { color: theme.accent }]}>{primeiraLetra}</Text>
                </View>
            )}
            
            <View style={{ flex: 1, marginLeft: 15, justifyContent: 'center' }}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2}}>
                    <Text style={[styles.alunoName, { color: theme.text }]} numberOfLines={1}>{item.name || 'Aluno Sem Nome'}</Text>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap'}}>
                    <View style={[styles.badgeBase, { backgroundColor: badge.color + '22' }]}>
                        <MaterialCommunityIcons name={badge.icon} size={10} color={badge.color} />
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>

                    {/* 🔥 SELO DO DELOAD MENSTRUAL 🔥 */}
                    {isMenstruating && (
                        <View style={[styles.badgeBase, { backgroundColor: hasDeload ? '#4DE38F22' : '#FF3B3022', borderColor: hasDeload ? '#4DE38F' : '#FF3B30', borderWidth: 1 }]}>
                            <MaterialCommunityIcons name={hasDeload ? "shield-check" : "water-alert"} size={10} color={hasDeload ? "#4DE38F" : "#FF3B30"} />
                            <Text style={[styles.badgeText, { color: hasDeload ? "#4DE38F" : "#FF3B30" }]}>
                                {hasDeload ? 'DELOAD ATIVO' : 'PROTOCOLO MENSTRUAL'}
                            </Text>
                        </View>
                    )}

                    {pendingCount > 0 && (
                        <View style={[styles.badgeBase, { backgroundColor: '#FF3B3022' }]}>
                            <MaterialCommunityIcons name="alert-circle" size={10} color="#FF3B30" />
                            <Text style={[styles.badgeText, { color: '#FF3B30' }]}>{pendingCount} AVALIAÇ{pendingCount > 1 ? 'ÕES' : 'ÃO'} PENDENTE{pendingCount > 1 ? 'S' : ''}</Text>
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
    avatarPlaceholder: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarText: { fontWeight: 'bold', fontSize: 18 },
    alunoName: { fontWeight: 'bold', fontSize: 16 },
    badgeBase: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    badgeText: { fontSize: 9, fontWeight: '900' },
    zapBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#25D366' },
    farolBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    farolText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }
});