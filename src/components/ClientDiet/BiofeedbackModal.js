// src/components/ClientDiet/BiofeedbackModal.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ActivityIndicator, Platform, Alert, ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BiofeedbackModal({ visible, onClose, theme, userId }) {
    const [fome, setFome] = useState(null);
    const [digestao, setDigestao] = useState(null);
    const [energia, setEnergia] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [salvo, setSalvo] = useState(false);

    // Carrega o feedback de hoje ao abrir o modal
    useEffect(() => {
        const loadFeedback = async () => {
            if (!userId || !visible) return;
            setIsLoading(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                // Rota que você vai criar no backend depois
                const res = await fetch(`https://fitos-final.onrender.com/api/checkins?studentId=${userId}&date=${today}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setFome(data.fome);
                        setDigestao(data.digestao);
                        setEnergia(data.energia);
                    }
                }
            } catch (err) {
                console.log("Erro ao buscar biofeedback:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadFeedback();
    }, [userId, visible]);

    const handleSave = async () => {
        if (!fome || !digestao || !energia) return;
        setIsSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            await fetch('https://fitos-final.onrender.com/api/checkins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: userId,
                    date: today,
                    fome, digestao, energia
                })
            });
            
            setSalvo(true);
            setTimeout(() => { 
                setSalvo(false); 
                onClose(); 
            }, 1500);

        } catch (err) {
            const msg = "Erro ao salvar o diário.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Erro", msg);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    {/* Header Elite (Estilo Dark Slate + Destaque Neon) */}
                    <View style={[styles.eliteHeader, { borderBottomColor: theme.accent }]}>
                        <TouchableOpacity style={styles.closeBtnElite} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                        </TouchableOpacity>
                        
                        <View style={[styles.headerIconBox, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                            <MaterialCommunityIcons name="heart-pulse" size={28} color={theme.accent} />
                        </View>
                        <Text style={styles.eliteTitle}>BIOFEEDBACK</Text>
                        <Text style={styles.eliteSub}>RELATÓRIO DIÁRIO</Text>
                    </View>

                    {isLoading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10, fontSize: 12 }}>Buscando registros...</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false}>
                            
                            {/* BLOCO: FOME */}
                            <View style={[styles.blockCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={styles.blockTitleRow}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={theme.accent} />
                                    <Text style={[styles.blockTitleText, { color: theme.textSecondary }]}>NÍVEL DE FOME</Text>
                                </View>
                                <View style={styles.optionsRow}>
                                    {['Baixa', 'Normal', 'Alta'].map(nivel => {
                                        const isActive = fome === nivel;
                                        return (
                                            <TouchableOpacity 
                                                key={nivel} 
                                                style={[styles.optionBtn, isActive ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                                onPress={() => setFome(nivel)}
                                            >
                                                <MaterialCommunityIcons name={isActive ? "checkbox-marked" : "square-outline"} size={16} color={isActive ? '#000' : theme.textSecondary} />
                                                <Text style={[styles.optionText, { color: isActive ? '#000' : theme.textSecondary }]} numberOfLines={1}>{nivel}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* BLOCO: DIGESTÃO */}
                            <View style={[styles.blockCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={styles.blockTitleRow}>
                                    <MaterialCommunityIcons name="stomach" size={14} color={theme.accent} />
                                    <Text style={[styles.blockTitleText, { color: theme.textSecondary }]}>DIGESTÃO E INTESTINO</Text>
                                </View>
                                <View style={styles.optionsRow}>
                                    {['Ruim', 'Normal', 'Perfeita'].map(nivel => {
                                        const isActive = digestao === nivel;
                                        return (
                                            <TouchableOpacity 
                                                key={nivel} 
                                                style={[styles.optionBtn, isActive ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                                onPress={() => setDigestao(nivel)}
                                            >
                                                <MaterialCommunityIcons name={isActive ? "checkbox-marked" : "square-outline"} size={16} color={isActive ? '#000' : theme.textSecondary} />
                                                <Text style={[styles.optionText, { color: isActive ? '#000' : theme.textSecondary }]} numberOfLines={1}>{nivel}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* BLOCO: ENERGIA */}
                            <View style={[styles.blockCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={styles.blockTitleRow}>
                                    <MaterialCommunityIcons name="battery-charging" size={14} color={theme.accent} />
                                    <Text style={[styles.blockTitleText, { color: theme.textSecondary }]}>ENERGIA GERAL</Text>
                                </View>
                                <View style={styles.optionsRow}>
                                    {['Baixa', 'Média', 'Alta'].map(nivel => {
                                        const isActive = energia === nivel;
                                        return (
                                            <TouchableOpacity 
                                                key={nivel} 
                                                style={[styles.optionBtn, isActive ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                                onPress={() => setEnergia(nivel)}
                                            >
                                                <MaterialCommunityIcons name={isActive ? "checkbox-marked" : "square-outline"} size={16} color={isActive ? '#000' : theme.textSecondary} />
                                                <Text style={[styles.optionText, { color: isActive ? '#000' : theme.textSecondary }]} numberOfLines={1}>{nivel}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </ScrollView>
                    )}

                    {/* RODAPÉ: BOTÃO SALVAR */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.submitBtn, { backgroundColor: salvo ? theme.accent : (theme.isDark ? '#FFF' : '#0F172A'), opacity: (!fome || !digestao || !energia) ? 0.5 : 1 }]} 
                            onPress={handleSave}
                            disabled={!fome || !digestao || !energia || isSaving || salvo}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} />
                            ) : salvo ? (
                                <>
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#000" />
                                    <Text style={[styles.submitText, { color: '#000' }]}>SALVO!</Text>
                                </>
                            ) : (
                                <Text style={[styles.submitText, { color: theme.isDark ? '#000' : '#FFF' }]}>REGISTRAR NO DIÁRIO</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalBox: { width: '100%', maxWidth: 440, borderRadius: 32, borderWidth: 1, overflow: 'hidden', maxHeight: '90%' },
    
    eliteHeader: { backgroundColor: '#0F172A', padding: 24, alignItems: 'center', borderBottomWidth: 4, position: 'relative' },
    closeBtnElite: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    headerIconBox: { width: 64, height: 64, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    eliteTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    eliteSub: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 4 },

    scrollBody: { flexShrink: 1 },

    blockCard: { padding: 16, borderRadius: 24, borderWidth: 1 },
    blockTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    blockTitleText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    
    optionsRow: { flexDirection: 'row', gap: 8 },
    optionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
    optionText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

    footer: { padding: 16, borderTopWidth: 1 },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 20 },
    submitText: { fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
});