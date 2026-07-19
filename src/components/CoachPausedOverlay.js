// src/components/CoachPausedOverlay.js
// Overlay gentil exibido no HomeScreen quando o coach do aluno está inadimplente
// NÃO menciona pagamento, plano vencido ou inadimplência
import React from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CoachPausedOverlay({ coachName, coachPhone, theme }) {
    const handleWhatsApp = () => {
        if (!coachPhone) return;
        const phone = coachPhone.replace(/\D/g, '');
        const msg   = 'Olá! Estou tentando acessar minha consultoria no app.';
        Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(msg)}`).catch(() => {});
    };

    return (
        <View style={[styles.overlay, { backgroundColor: theme.bg }]}>
            <View style={styles.content}>

                {/* Ícone */}
                <View style={[styles.iconCircle, { backgroundColor: theme.accent + '18' }]}>
                    <MaterialCommunityIcons name="pause-circle-outline" size={56} color={theme.accent} />
                </View>

                {/* Mensagem — sem mencionar pagamento */}
                <Text style={[styles.title, { color: theme.text }]}>
                    Consultoria pausada
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    Sua consultoria está temporariamente pausada.{'\n'}
                    Entre em contato com{coachName ? ` ${coachName.split(' ')[0]}` : ' seu coach'} para mais informações.
                </Text>

                {/* Botão WhatsApp — só aparece se tiver o número */}
                {coachPhone && (
                    <TouchableOpacity
                        style={[styles.whatsBtn, { backgroundColor: '#25D36620', borderColor: '#25D36650' }]}
                        onPress={handleWhatsApp}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                        <Text style={{ color: '#25D366', fontWeight: '900', fontSize: 14 }}>
                            FALAR COM {coachName ? coachName.split(' ')[0].toUpperCase() : 'MEU COACH'}
                        </Text>
                    </TouchableOpacity>
                )}

                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    Seu histórico e dados estão seguros.{'\n'}O acesso será restaurado em breve.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay:    { ...StyleSheet.absoluteFillObject, zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 28 },
    content:    { alignItems: 'center', maxWidth: 340 },
    iconCircle: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title:      { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    subtitle:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, color: '#888' },
    whatsBtn:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
    hint:       { fontSize: 12, textAlign: 'center', lineHeight: 18, opacity: 0.6 },
});
