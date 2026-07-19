// src/screens/CoachBlockedScreen.js
// Tela exibida quando o coach está inadimplente
// Mostra mensagem clara + botão para regularizar + botão de suporte
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const PAULO_WHATSAPP = '5541999999999'; // ← substitua pelo número real

export default function CoachBlockedScreen({ navigation, route }) {
    const { theme }    = useTheme();
    const [loading, setLoading] = useState(false);

    const invoiceUrl   = route.params?.invoiceUrl   ?? null;
    const coachName    = route.params?.coachName    ?? 'Coach';
    const billingPlan  = route.params?.billingPlan  ?? '';
    const billingEnd   = route.params?.billingEnd   ?? null;

    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    };

    const handleOpenInvoice = () => {
        if (invoiceUrl) Linking.openURL(invoiceUrl).catch(() => {});
    };

    const handleContactSupport = () => {
        const msg = `Olá! Sou o coach ${coachName} e preciso regularizar meu acesso ao ELITE FIT.`;
        Linking.openURL(`whatsapp://send?phone=${PAULO_WHATSAPP}&text=${encodeURIComponent(msg)}`).catch(() => {});
    };

    const handleLogout = async () => {
        setLoading(true);
        await AsyncStorage.multiRemove(['user', 'role', '@dashboard_cache']);
        if (Platform.OS === 'web') window.location.replace('/');
        else navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        setLoading(false);
    };

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
            <View style={styles.content}>

                {/* Ícone */}
                <View style={[styles.iconCircle, { backgroundColor: '#FF3B3015' }]}>
                    <MaterialCommunityIcons name="lock-clock" size={52} color="#FF3B30" />
                </View>

                {/* Título */}
                <Text style={[styles.title, { color: theme.text }]}>
                    Acesso Suspenso
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Identificamos uma pendência financeira na sua conta ELITE FIT.
                    Regularize para voltar a acessar o painel e não impactar seus alunos.
                </Text>

                {/* Detalhe do plano */}
                {billingPlan ? (
                    <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons name="calendar-alert" size={16} color="#FF9500" />
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                Plano vencido em <Text style={{ color: '#FF3B30', fontWeight: '900' }}>{formatDate(billingEnd)}</Text>
                            </Text>
                        </View>
                        <View style={[styles.infoRow, { marginTop: 8 }]}>
                            <MaterialCommunityIcons name="shield-account-outline" size={16} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                {billingPlan.replace(/_/g, ' ')}
                            </Text>
                        </View>
                    </View>
                ) : null}

                {/* Aviso sobre alunos */}
                <View style={[styles.warningCard, { backgroundColor: '#FF950010', borderColor: '#FF950040' }]}>
                    <MaterialCommunityIcons name="account-group" size={16} color="#FF9500" />
                    <Text style={{ color: '#FF9500', fontSize: 12, flex: 1, lineHeight: 18 }}>
                        Seus alunos estão com o acesso pausado enquanto houver pendência. Regularize agora para reativar tudo automaticamente.
                    </Text>
                </View>

                {/* Botões */}
                <View style={styles.buttons}>
                    {invoiceUrl && (
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                            onPress={handleOpenInvoice}
                        >
                            <MaterialCommunityIcons name="cash-check" size={20} color="#000" />
                            <Text style={{ color: '#000', fontWeight: '900', fontSize: 15 }}>
                                PAGAR AGORA
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.secondaryBtn, { backgroundColor: '#25D36620', borderColor: '#25D36650' }]}
                        onPress={handleContactSupport}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                        <Text style={{ color: '#25D366', fontWeight: '900', fontSize: 13 }}>
                            FALAR COM SUPORTE
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color={theme.textSecondary} />
                            : <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Sair da conta</Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root:        { flex: 1 },
    content:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
    iconCircle:  { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title:       { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    subtitle:    { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    infoCard:    { width: '100%', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12 },
    infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    warningCard: { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 28 },
    buttons:     { width: '100%', gap: 12 },
    primaryBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 18, borderRadius: 16 },
    secondaryBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
    logoutBtn:   { alignItems: 'center', paddingVertical: 8 },
});
