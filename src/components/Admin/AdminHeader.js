// src/components/AdminHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PAULO_ID, ADRI_ID } from '../../constants/masterIds';

export default function AdminHeader({ theme, toggleDarkMode, fetchData, handleLogout, adminId, hideTitle }) {

    const isMaster = adminId === PAULO_ID || adminId === ADRI_ID;

    return (
        <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 10, overflow: 'hidden', minWidth: 0 }}>
                {!hideTitle && (
                    isMaster ? (
                        // 🔥 MASTER (Paulo / Adri) — cores do logo PA ELITE TEAM
                        <>
                            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                                <Text style={{ color: '#7B2FBE' }}>PA </Text>
                                <Text style={{ color: '#6DBF1E' }}>ELITE </Text>
                                <Text style={{ color: '#7B2FBE' }}>TEAM</Text>
                            </Text>
                            <Text style={styles.subtitle}>CONSULTORIA DE PERFORMANCE</Text>
                        </>
                    ) : (
                        // 🤝 COACH PARCEIRO
                        <>
                            <Text style={[styles.title, { color: theme.accent }]} numberOfLines={1} ellipsizeMode="tail">
                                ELITE FIT
                            </Text>
                            <Text style={styles.subtitle}>CONSULTORIA DE PERFORMANCE — PAINEL ADMINISTRATIVO</Text>
                        </>
                    )
                )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TouchableOpacity onPress={toggleDarkMode} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name={theme.isDark ? 'white-balance-sunny' : 'moon-waning-crescent'} size={20} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => fetchData(true)} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="refresh" size={20} color={theme.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleLogout} style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header:   { paddingTop: Platform.OS === 'android' ? 30 : 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title:    { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { color: '#888', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginTop: 2 },
    iconBtn:  { width: 40, height: 40, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
});