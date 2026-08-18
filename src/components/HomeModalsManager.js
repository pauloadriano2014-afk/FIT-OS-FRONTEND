// src/components/HomeModalsManager.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import LevelUpModal           from './LevelUpModal';
import HomeNoticeModal        from './HomeNoticeModal';
import ChatAIAssistantModal   from './ChatAIAssistantModal';
import DietGuideModal         from './DietGuideModal';
import StudentReportModal     from './StudentReportModal';
import InitialPhotosModal     from './InitialPhotosModal';
import SatisfactionSurveyModal from './SatisfactionSurveyModal';
import FinancePaymentModal    from './FinancePaymentModal';
import RecurrencePaymentModal from './RecurrencePaymentModal';

export default function HomeModalsManager({
    theme,
    navigation,
    isWeb,
    home,
    states,
    helpers
}) {
    const { coachNameLabel, coachWhatsappNumber, photoModal } = helpers;

    return (
        <>
            {/* Modal de Anamnese Pendente */}
            <Modal visible={states.anamnesePendingModalVisible} transparent animationType="fade" onRequestClose={() => states.setAnamnesePendingModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}>
                            <MaterialCommunityIcons name="clipboard-alert-outline" size={36} color={theme.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>ATUALIZAÇÃO NECESSÁRIA</Text>
                        
                        <Text style={[styles.cardDesc, { color: theme.textSecondary, marginBottom: 25 }]}>
                            Seu Treinador solicitou uma <Text style={{ color: theme.text, fontWeight: 'bold' }}>atualização na sua ficha</Text>.
                            {'\n\n'}
                            ⚠️ <Text style={{ color: theme.accent, fontWeight: 'bold' }}>Atenção:</Text> Sem esses dados, sua estratégia ficará paralisada e seus resultados podem ser comprometidos. Preencha assim que possível para receber a sua nova periodização!
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.btn, { backgroundColor: theme.accent, marginBottom: 15 }]}
                            onPress={() => {
                                states.setAnamnesePendingModalVisible(false);
                                navigation.navigate('Anamnese'); 
                            }}
                        >
                            <Text style={[styles.btnText, { color: '#000' }]}>PREENCHER AGORA</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#000" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <TouchableOpacity style={{ padding: 10 }} onPress={() => states.setAnamnesePendingModalVisible(false)}>
                            <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                                Entendi os riscos, responder depois
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal Financeiro */}
            {home.isFinanceLocked && (
                <Modal visible={states.financeModalVisible} transparent animationType="fade" onRequestClose={() => states.setFinanceModalVisible(false)}>
                    <View style={styles.overlay}>
                        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                            <View style={[styles.iconBox, { backgroundColor: '#FF3B3022', marginBottom: 20 }]}>
                                <MaterialCommunityIcons name="lock-alert" size={36} color="#FF3B30" />
                            </View>
                            <Text style={[styles.cardTitle, { color: theme.text }]}>ACESSO SUSPENSO</Text>

                            <Text style={[styles.cardDesc, { color: theme.textSecondary, marginBottom: 15 }]}>
                                O seu plano venceu e o acesso à área de treinos foi suspenso temporariamente.
                                {'\n'}Pague agora mesmo pelo app e libere seu acesso em segundos.
                            </Text>

                            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.accent, marginBottom: 10 }]} onPress={() => {
                                states.setFinanceModalVisible(false);
                                states.setPaymentModalVisible(true);
                            }}>
                                <Text style={[styles.btnText, { color: '#000' }]}>PAGAR AGORA (PIX/CARTÃO)</Text>
                                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#000" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent, marginBottom: 10 }]}
                                onPress={() => {
                                    states.setFinanceModalVisible(false);
                                    states.setRecurrenceModalVisible(true);
                                }}
                            >
                                <Text style={[styles.btnText, { color: theme.accent }]}>ATIVAR PAGAMENTO AUTOMÁTICO</Text>
                                <MaterialCommunityIcons name="credit-card-sync-outline" size={20} color={theme.accent} style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            {home.paymentClaimExpired && (
                                <View style={[styles.claimExpiredBox, { backgroundColor: '#FF950022', borderColor: '#FF9500' }]}>
                                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF9500" />
                                    <Text style={{ color: theme.text, fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 17 }}>
                                        O prazo para confirmação automática acabou. Fale direto com seu coach para liberar seu treino.
                                    </Text>
                                </View>
                            )}

                            {home.canClaimPayment && (
                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: theme.surface, borderWidth: 1, borderColor: '#32ADE6', marginBottom: 10 }]}
                                    onPress={home.handleClaimPayment}
                                    disabled={home.isClaimingPayment}
                                >
                                    {home.isClaimingPayment ? <ActivityIndicator color="#32ADE6" /> : (
                                        <>
                                            <Text style={[styles.btnText, { color: '#32ADE6' }]}>PAGUEI POR FORA, REGISTRAR</Text>
                                            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#32ADE6" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#25D366', marginBottom: 10 }]}
                                onPress={() => Linking.openURL(`https://wa.me/${coachWhatsappNumber}?text=${encodeURIComponent("Acabei de verificar o painel e preciso falar sobre a renovação da minha assinatura!")}`)}
                            >
                                <Text style={[styles.btnText, { color: '#FFF' }]}>FALAR COM {coachNameLabel}</Text>
                                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.btn, { backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, shadowOpacity: 0, elevation: 0 }]} onPress={() => states.setFinanceModalVisible(false)}>
                                <Text style={[styles.btnText, { color: theme.text }]}>FECHAR PAINEL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            <FinancePaymentModal visible={states.paymentModalVisible} onClose={() => states.setPaymentModalVisible(false)} theme={theme} userId={home.userData?.id} onPaid={() => home.loadHomeData()} />

            <RecurrencePaymentModal visible={states.recurrenceModalVisible} onClose={() => states.setRecurrenceModalVisible(false)} theme={theme} userId={home.userData?.id} onActivated={() => home.loadHomeData()} />

            <Modal visible={states.upsellModalVisible} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => states.setUpsellModalVisible(false)}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '22', marginBottom: 20 }]}>
                            <MaterialCommunityIcons name="crown" size={36} color={theme.accent} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>FUNCIONALIDADE ELITE</Text>
                        <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                            O recurso de <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{states.upsellFeature}</Text> é exclusivo para atletas da Consultoria Elite.
                        </Text>
                        <View style={[styles.benefitsBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            {['Ajuste de Treino Sob Medida', 'Avaliação Quinzenal do Shape', 'Acesso direto ao Coach'].map(b => (
                                <View key={b} style={styles.benefitRow}>
                                    <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                                    <Text style={[styles.benefitText, { color: theme.text }]}>{b}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.btn}
                            onPress={() => {
                                states.setUpsellModalVisible(false);
                                Linking.openURL(`https://wa.me/${coachWhatsappNumber}?text=${encodeURIComponent("Coach, quero subir de nível e migrar meu plano para a Consultoria Elite!")}`);
                            }}
                        >
                            <Text style={styles.btnText}>SER ELITE AGORA</Text>
                            <MaterialCommunityIcons name="whatsapp" size={20} color="#000" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <StudentReportModal visible={states.feedbackModalVisible} onClose={() => states.setFeedbackModalVisible(false)} pendingFeedback={home.pendingFeedback} userName={home.userName} markFeedbackAsRead={() => home.markFeedbackAsRead(() => states.setFeedbackModalVisible(false))} isMarkingAsRead={home.isMarkingAsRead} />
            <InitialPhotosModal visible={states.initialPhotosModalVisible} onClose={() => states.setInitialPhotosModalVisible(false)} theme={theme} photoModal={photoModal} userPlan={home.userPlan} onNavigate={() => { states.setInitialPhotosModalVisible(false); navigation.navigate('CheckIn'); }} />
            <SatisfactionSurveyModal visible={home.isSurveyVisible} onClose={() => home.setIsSurveyVisible(false)} userId={home.userData?.id} theme={theme} isPremium={home.userPlan === 'PREMIUM' || home.userPlan === 'ELITE'} />
            <DietGuideModal visible={states.dietModalVisible} onClose={() => states.setDietModalVisible(false)} theme={theme} dietGoal={home.userPlan === 'CHALLENGE_21' ? 'WEIGHT_LOSS' : home.userData?.dietGoal} />
            <LevelUpModal visible={states.levelModalVisible} onClose={() => states.setLevelModalVisible(false)} theme={theme} levelData={home.levelData} currentLevel={home.currentLevel} currentLevelProgress={home.currentLevelProgress} nextLevelXP={home.nextLevelXP} />
            <HomeNoticeModal visible={states.noticeModalVisible} onClose={() => home.handleReadNotice(() => states.setNoticeModalVisible(false))} theme={theme} activeNotice={home.activeNotice} />
            
            <ChatAIAssistantModal visible={states.chatVisible} onClose={() => states.setChatVisible(false)} theme={theme} isWeb={isWeb} messages={home.messages} flatListRef={home.flatListRef} chatInput={home.chatInput} setChatInput={home.setChatInput} handleSendChat={home.handleSendChat} isTyping={home.isTyping} QUICK_QUESTIONS={home.QUICK_QUESTIONS} />
        </>
    );
}

const styles = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
    card:       { width: '90%', maxWidth: 420, alignSelf: 'center', padding: 25, borderRadius: 24, borderWidth: 2, alignItems: 'center' },
    closeBtn:   { position: 'absolute', top: 15, right: 15, padding: 5, zIndex: 10 },
    iconBox:    { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    cardTitle:  { fontSize: 22, fontWeight: '900', marginBottom: 10, letterSpacing: 1, textAlign: 'center' },
    cardDesc:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    benefitsBox:{ width: '100%', padding: 15, borderRadius: 16, borderWidth: 1, gap: 12, marginBottom: 25 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    benefitText:{ fontSize: 13, fontWeight: 'bold' },
    btn:        { width: '100%', padding: 18, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5, marginBottom: 0 },
    btnText:    { fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    claimExpiredBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 15 },
});