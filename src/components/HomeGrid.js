// src/components/HomeGrid.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Grid de 4 atalhos rápidos (Check-in, Evolução, Histórico, PA Flix)
 * e rodapé com a marca PA TEAM.
 */
export default function HomeGrid({
    theme,
    navigation,
    pulseAnim,

    // Check-in
    userPlan,
    disableCheckIn,
    needsInitialPhoto,
    isCheckinPending,

    // Pulse exclusivo do check-in (só quando não há feedback pendente)
    pendingFeedback,
}) {
    const canFreeCheckin = userPlan === 'PREMIUM' || disableCheckIn;

    const handleCheckinPress = () => {
        if (disableCheckIn) return navigation.navigate('CheckIn');
        if (canFreeCheckin || needsInitialPhoto || isCheckinPending) return navigation.navigate('CheckIn');
        Alert.alert("Acesso Bloqueado", "O Coach precisa liberar o seu próximo check-in no sistema.");
    };

    const checkinIcon = canFreeCheckin || needsInitialPhoto || isCheckinPending
        ? "camera-plus"
        : "camera-off";

    const checkinLabel = canFreeCheckin ? 'Check-in Livre' : 'Fotos do Shape';

    const hasDot = isCheckinPending && !disableCheckIn;

    // Aplica o pulseAnim ao card de check-in somente quando não há feedback dominando
    const Wrapper = (!pendingFeedback && hasDot)
        ? ({ children, style }) => (
            <View style={[{ transform: [{ scale: pulseAnim }] }, style]}>{children}</View>
          )
        : ({ children, style }) => <View style={style}>{children}</View>;

    return (
        <>
            <View style={styles.grid}>
                {/* Check-in */}
                <Wrapper style={{ width: '48%', marginBottom: 15 }}>
                    <TouchableOpacity
                        style={[styles.item, {
                            width: '100%', marginBottom: 0,
                            backgroundColor: theme.surface,
                            borderColor: hasDot ? (isCheckinPending && !disableCheckIn ? (false ? '#FF3B30' : '#FF9500') : theme.border) : theme.border,
                        }]}
                        onPress={handleCheckinPress}
                    >
                        {hasDot && <View style={[styles.dot, { borderColor: theme.bg }]} />}
                        <View style={[styles.iconBox, { backgroundColor: theme.accent + '33' }]}>
                            <MaterialCommunityIcons name={checkinIcon} size={24} color={theme.accent} />
                        </View>
                        <Text style={[styles.label, { color: theme.text }]}>{checkinLabel}</Text>
                    </TouchableOpacity>
                </Wrapper>

                {/* Evolução */}
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('Evolução')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(50, 173, 230, 0.2)' }]}>
                        <MaterialCommunityIcons name="chart-line" size={24} color="#32ADE6" />
                    </View>
                    <Text style={[styles.label, { color: theme.text }]}>Evolução</Text>
                </TouchableOpacity>

                {/* Histórico */}
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('UserHistory')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
                        <MaterialCommunityIcons name="history" size={24} color="#FF3B30" />
                    </View>
                    <Text style={[styles.label, { color: theme.text }]}>Histórico</Text>
                </TouchableOpacity>

                {/* PA Flix */}
                <TouchableOpacity
                    style={[styles.item, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('Biblioteca')}
                >
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 149, 0, 0.2)' }]}>
                        <MaterialCommunityIcons name="play-box-multiple" size={24} color="#FF9500" />
                    </View>
                    <Text style={[styles.label, { color: theme.text }]}>PA Flix</Text>
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerBrand, { color: theme.text }]}>PA TEAM</Text>
                <Text style={[styles.footerSub, { color: theme.textSecondary }]}>CONSULTORIA DE PERFORMANCE</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    grid:       { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 15 },
    item:       { width: '48%', padding: 18, borderRadius: 24, alignItems: 'center', borderWidth: 1, marginBottom: 15 },
    iconBox:    { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    label:      { fontSize: 11, fontWeight: 'bold' },
    dot:        { position: 'absolute', top: -4, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', borderWidth: 2, zIndex: 10 },
    footer:     { alignItems: 'center', marginTop: 20, marginBottom: 10 },
    footerBrand:{ fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
    footerSub:  { fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginTop: 4 },
});