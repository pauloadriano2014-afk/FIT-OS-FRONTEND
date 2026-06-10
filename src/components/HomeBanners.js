// src/components/HomeBanners.js
import React from 'react';
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

/**
 * Agrupa todos os banners de status exibidos na Home:
 * - Banner financeiro (vencimento / bloqueio)
 * - Banner de novo vídeo (PA Flix)
 * - Banner de protocolo menstrual
 * - Banner de foto inicial pendente
 * - Banner de check-in pendente / atrasado
 * - Banner "aguardando coach" (Elite)
 * - Banner "plano sem agendamento"
 * - Banner de check-in agendado (com contagem regressiva)
 */
export default function HomeBanners({
    theme,
    navigation,

    // Financeiro
    daysToPay,
    isFinanceLocked,
    disableCheckIn,
    onOpenFinanceModal,

    // Vídeo
    showVideoAlert,
    newVideoContent,
    pulseAnim,
    onDismissVideo,

    // Menstrual
    isFemale,
    isMenstruating,
    togglingMenstrual,
    onToggleMenstrual,

    // Foto inicial
    needsInitialPhoto,
    pendingFeedback,
    onOpenInitialPhotos,

    // Check-in
    isCheckinPending,
    isCheckinLate,
    isEliteAwaitingCoach,
    scheduledCheckInDate,
    userPlan,
    hasSentInitialPhotos,
}) {
    return (
        <>
            {/* ── Banner Financeiro ───────────────────────────────────────── */}
            {daysToPay !== null && daysToPay <= 7 && !disableCheckIn && (
                <TouchableOpacity
                    style={[styles.banner, {
                        backgroundColor: daysToPay <= 3 ? '#FF3B3015' : '#FF950015',
                        borderColor:     daysToPay <= 3 ? '#FF3B30'   : '#FF9500',
                        padding: 16,
                    }]}
                    onPress={() => { if (daysToPay <= 0) onOpenFinanceModal(); }}
                    activeOpacity={0.9}
                >
                    <MaterialCommunityIcons
                        name={daysToPay <= 0 ? "lock" : "alert"}
                        size={22}
                        color={daysToPay <= 3 ? '#FF3B30' : '#FF9500'}
                    />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ color: daysToPay <= 3 ? '#FF3B30' : '#FF9500', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
                            {daysToPay <= 0 ? 'ACESSO SUSPENSO:' : (daysToPay <= 3 ? 'VENCIMENTO URGENTE:' : 'RENOVAÇÃO PRÓXIMA:')}
                        </Text>
                        <Text style={{ color: daysToPay <= 3 ? '#FF3B30' : '#FF9500', fontSize: 13, fontWeight: 'bold' }}>
                            {daysToPay <= 0
                                ? 'O seu plano está expirado. Regularize para liberar o treino.'
                                : `Seu plano vence em ${daysToPay} dia${daysToPay > 1 ? 's' : ''}.`}
                        </Text>
                    </View>
                    {daysToPay <= 0 && <MaterialCommunityIcons name="chevron-right" size={20} color="#FF3B30" />}
                </TouchableOpacity>
            )}

            {/* ── Banner Novo Vídeo ───────────────────────────────────────── */}
            {showVideoAlert && newVideoContent && (
                <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%', marginBottom: 15 }}>
                    <View style={[styles.videoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <TouchableOpacity
                            style={styles.videoImageContainer}
                            activeOpacity={0.9}
                            onPress={() => { onDismissVideo(); navigation.navigate('Biblioteca'); }}
                        >
                            <Image
                                source={{ uri: newVideoContent.thumbUrl || 'https://via.placeholder.com/600x338' }}
                                style={styles.videoThumb}
                                contentFit="cover"
                            />
                            <View style={styles.videoOverlay}>
                                <View style={styles.videoPlayBtn}>
                                    <MaterialCommunityIcons name="play" size={32} color="#FFF" />
                                </View>
                            </View>
                            <View style={styles.videoTag}>
                                <Text style={styles.videoTagText}>NOVA AULA NO PA FLIX</Text>
                            </View>
                            <TouchableOpacity style={styles.videoCloseTop} onPress={onDismissVideo}>
                                <MaterialCommunityIcons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.videoFooter}
                            activeOpacity={0.8}
                            onPress={() => { onDismissVideo(); navigation.navigate('Biblioteca'); }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.videoTitle, { color: theme.text }]} numberOfLines={2}>
                                    {newVideoContent.title}
                                </Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold' }}>
                                    Categoria: {newVideoContent.category}
                                </Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.accent} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}

            {/* ── Banner Menstrual ────────────────────────────────────────── */}
            {isFemale && (
                <View style={[styles.banner, {
                    backgroundColor: isMenstruating ? '#FF3B3015' : theme.surface,
                    borderColor:     isMenstruating ? '#FF3B30'   : theme.border,
                    padding: 16, marginTop: -10, marginBottom: 20, alignItems: 'center',
                }]}>
                    <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: isMenstruating ? '#FF3B3033' : theme.accent + '15',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <MaterialCommunityIcons
                            name={isMenstruating ? "water" : "water-outline"}
                            size={24}
                            color={isMenstruating ? '#FF3B30' : theme.accent}
                        />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                        <Text style={{ color: isMenstruating ? '#FF3B30' : theme.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                            {isMenstruating ? 'DELOAD MENSTRUAL' : 'PROTOCOLO MENSTRUAL'}
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: 'bold', marginTop: 2, lineHeight: 14 }}>
                            {isMenstruating ? 'Treino adaptado para proteção.' : 'Adapte a intensidade nestes dias.'}
                        </Text>
                        <TouchableOpacity
                            style={{ marginTop: 6 }}
                            onPress={() => {
                                const title = "A Ciência do Deload 🩸";
                                const msg   = "Durante o período menstrual, a queda hormonal afeta drasticamente sua força e recuperação muscular.\n\nAo sinalizar, o Coach recebe um alerta imediato e ajusta as cargas e o volume do seu treino (Deload).\n\nIsso protege suas articulações, evita frustrações e mantém seu progresso contínuo de forma inteligente!";
                                if (Platform.OS === 'web') window.alert(title + "\n\n" + msg);
                                else Alert.alert(title, msg);
                            }}
                        >
                            <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textDecorationLine: 'underline' }}>
                                COMO FUNCIONA?
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={onToggleMenstrual} disabled={togglingMenstrual} style={{ marginLeft: 5 }}>
                        {togglingMenstrual ? (
                            <ActivityIndicator size="small" color={isMenstruating ? '#FF3B30' : theme.textSecondary} />
                        ) : (
                            <MaterialCommunityIcons
                                name={isMenstruating ? "toggle-switch" : "toggle-switch-off-outline"}
                                size={48}
                                color={isMenstruating ? '#FF3B30' : theme.textSecondary}
                            />
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Foto inicial pendente ───────────────────────────────────── */}
            {needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                <TouchableOpacity
                    style={[styles.banner, { backgroundColor: '#FF3B3015', borderColor: '#FF3B30', padding: 16 }]}
                    onPress={onOpenInitialPhotos}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="alert" size={22} color="#FF3B30" />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>AÇÃO OBRIGATÓRIA:</Text>
                        <Text style={{ color: '#FF3B30', fontSize: 13, fontWeight: 'bold' }}>Envie sua foto de ponto de partida.</Text>
                    </View>
                    <MaterialCommunityIcons name="camera" size={20} color="#FF3B30" />
                </TouchableOpacity>
            )}

            {/* ── Check-in pendente / atrasado ────────────────────────────── */}
            {isCheckinPending && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                <TouchableOpacity
                    style={[styles.banner, {
                        backgroundColor: isCheckinLate ? '#FF3B3015' : '#FF950015',
                        borderColor:     isCheckinLate ? '#FF3B30'   : '#FF9500',
                        padding: 16,
                    }]}
                    onPress={() => navigation.navigate('CheckIn')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons
                        name={isCheckinLate ? "alert" : "camera-timer"}
                        size={22}
                        color={isCheckinLate ? '#FF3B30' : '#FF9500'}
                    />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ color: isCheckinLate ? '#FF3B30' : '#FF9500', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
                            O COACH ESTÁ TE ESPERANDO:
                        </Text>
                        <Text style={{ color: isCheckinLate ? '#FF3B30' : '#FF9500', fontSize: 13, fontWeight: 'bold' }}>
                            {isCheckinLate ? 'Seu check-in está atrasado!' : 'Seu check-in foi liberado!'}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="camera" size={20} color={isCheckinLate ? '#FF3B30' : '#FF9500'} />
                </TouchableOpacity>
            )}

            {/* ── Elite aguardando coach ───────────────────────────────────── */}
            {isEliteAwaitingCoach && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (
                <View style={[styles.banner, { backgroundColor: theme.accent + '15', borderColor: theme.accent, padding: 16 }]}>
                    <MaterialCommunityIcons name="check-circle" size={22} color={theme.accent} />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>TUDO EM ORDEM:</Text>
                        <Text style={{ color: theme.accent, fontSize: 13, fontWeight: 'bold' }}>
                            Avaliação recebida! O Coach programará seu próximo check-in.
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Plano sem agendamento ────────────────────────────────────── */}
            {userPlan !== 'PREMIUM' && !scheduledCheckInDate && hasSentInitialPhotos && !pendingFeedback && !disableCheckIn && (
                <View style={[styles.banner, { backgroundColor: theme.textSecondary + '15', borderColor: theme.border, padding: 16 }]}>
                    <MaterialCommunityIcons name="calendar-lock" size={22} color={theme.textSecondary} />
                    <View style={{ flex: 1, marginLeft: 5 }}>
                        <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>STATUS DO PLANO:</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: 'bold' }}>
                            As próximas avaliações serão liberadas na data agendada.
                        </Text>
                    </View>
                </View>
            )}

            {/* ── Check-in agendado (contagem regressiva) ─────────────────── */}
            {scheduledCheckInDate && !isCheckinPending && !needsInitialPhoto && !pendingFeedback && !disableCheckIn && (() => {
                const parts = scheduledCheckInDate.split('/');
                const tDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const diff  = Math.ceil((tDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

                let bg     = 'rgba(50, 173, 230, 0.15)', border = '#32ADE6', icon = 'shield-check';
                let text   = `Seu próximo check-in será em ${diff} dias.`;
                if (diff <= 3) { bg = 'rgba(255, 59, 48, 0.15)';  border = '#FF3B30'; icon = 'timer-sand';     text = `Atenção: Faltam apenas ${diff} dias para a avaliação!`; }
                else if (diff <= 7) { bg = 'rgba(255, 149, 0, 0.15)'; border = '#FF9500'; icon = 'calendar-clock'; text = `Faltam ${diff} dias para enviar fotos.`; }

                return (
                    <View style={[styles.banner, { backgroundColor: bg, borderColor: border, padding: 16 }]}>
                        <MaterialCommunityIcons name={icon} size={22} color={border} />
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text style={{ color: border, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>STATUS DA AVALIAÇÃO:</Text>
                            <Text style={{ color: border, fontSize: 13, fontWeight: 'bold' }}>{text}</Text>
                        </View>
                    </View>
                );
            })()}
        </>
    );
}

const styles = {
    banner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 15,
    },
    videoCard: {
        borderRadius: 20, borderWidth: 1, overflow: 'hidden',
        elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    },
    videoImageContainer: {
        width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000',
        justifyContent: 'center', alignItems: 'center',
    },
    videoThumb:   { width: '100%', height: '100%', position: 'absolute' },
    videoOverlay: { ...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    videoPlayBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    videoTag:     { position: 'absolute', top: 15, left: 15, backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    videoTagText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    videoCloseTop: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    videoFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15 },
    videoTitle:   { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
};