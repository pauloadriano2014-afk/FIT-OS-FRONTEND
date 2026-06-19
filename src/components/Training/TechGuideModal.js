// src/components/Training/TechGuideModal.js
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TechVideoPlayer from './TechVideoPlayer';

const TABS = {
    TEXT: 'TEXT',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
};

export default function TechGuideModal({ visible, onClose, theme, selectedTech, TECH_GUIDE, isPlayingTechVoice, handlePlayTechVoice, isWeb }) {
    const techData = selectedTech && TECH_GUIDE[selectedTech] ? TECH_GUIDE[selectedTech] : null;
    const accentColor = techData?.color === theme.accent && !theme.isDark ? theme.accent : techData?.color;

    const hasAudio = !!techData?.audio;
    const hasVideo = !!techData?.videoUrl;

    // Aba ativa. Sempre reseta para TEXT quando a técnica selecionada muda
    // (evita abrir o modal de uma técnica nova já caindo numa aba de vídeo
    // que ela não tem, por exemplo).
    const [activeTab, setActiveTab] = useState(TABS.TEXT);

    useEffect(() => {
        if (visible) setActiveTab(TABS.TEXT);
    }, [selectedTech, visible]);

    // 🔥 Função Mágica para Negrito e Quebra de Linha Automática (preservada
    // exatamente como estava — nenhuma mudança na lógica de formatação)
    const renderDescription = (desc, textColor) => {
        if (!desc) return null;

        let textClean = desc.replace(/POR QUE FAZER:/g, '\n\nPOR QUE FAZER:');
        textClean = textClean.replace(/\n{3,}/g, '\n\n');

        const paragraphs = textClean.split('\n');

        return paragraphs.map((p, idx) => {
            if (p.trim() === '') {
                return <View key={idx} style={{ height: 10 }} />;
            }

            const regex = /(COMO EXECUTAR:|POR QUE FAZER:)/g;
            const parts = p.split(regex);

            return (
                <Text key={idx} style={[styles.desc, { color: textColor, marginBottom: 8 }]}>
                    {parts.map((part, pIdx) => {
                        if (part === 'COMO EXECUTAR:' || part === 'POR QUE FAZER:') {
                            return <Text key={pIdx} style={{ fontWeight: '900', letterSpacing: 0.5 }}>{part}</Text>;
                        }
                        return <Text key={pIdx}>{part}</Text>;
                    })}
                </Text>
            );
        });
    };

    const TabButton = ({ tabKey, icon, label }) => {
        const isActive = activeTab === tabKey;
        return (
            <TouchableOpacity
                onPress={() => setActiveTab(tabKey)}
                style={[
                    styles.tabBtn,
                    { borderColor: theme.border },
                    isActive && { backgroundColor: (accentColor || theme.accent) + '22', borderColor: accentColor || theme.accent }
                ]}
            >
                <MaterialCommunityIcons name={icon} size={16} color={isActive ? (accentColor || theme.accent) : theme.textSecondary} />
                <Text style={[styles.tabBtnText, { color: isActive ? (accentColor || theme.accent) : theme.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.contentCard, { backgroundColor: theme.surface, borderColor: accentColor || theme.border, maxWidth: isWeb ? 440 : '100%' }]}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                        <View style={styles.header}>
                            <MaterialCommunityIcons name={techData ? techData.icon : 'dumbbell'} size={28} color={accentColor || theme.text} />
                            <Text style={[styles.title, { color: accentColor || theme.text }]}>{techData ? techData.title : ''}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        {/* Abas só aparecem se houver mais de uma opção de conteúdo disponível */}
                        {(hasAudio || hasVideo) && (
                            <View style={styles.tabRow}>
                                <TabButton tabKey={TABS.TEXT} icon="text-box-outline" label="TEXTO" />
                                {hasAudio && <TabButton tabKey={TABS.AUDIO} icon="headphones" label="ÁUDIO" />}
                                {hasVideo && <TabButton tabKey={TABS.VIDEO} icon="play-circle-outline" label="VÍDEO" />}
                            </View>
                        )}

                        {activeTab === TABS.TEXT && (
                            <View style={{ marginTop: 5 }}>
                                {renderDescription(techData ? techData.desc : '', theme.text)}
                            </View>
                        )}

                        {activeTab === TABS.AUDIO && hasAudio && (
                            <View style={{ marginTop: 5, alignItems: 'center' }}>
                                <Text style={[styles.desc, { color: theme.textSecondary, textAlign: 'center', marginBottom: 15 }]}>
                                    Ouça a explicação do Coach sobre esta técnica.
                                </Text>
                                <TouchableOpacity onPress={() => handlePlayTechVoice(selectedTech)} style={[styles.audioBtn, { width: '100%', borderColor: isPlayingTechVoice ? '#FF3B30' : theme.textSecondary, backgroundColor: isPlayingTechVoice ? 'rgba(255,59,48,0.1)' : 'transparent' }]}>
                                    <MaterialCommunityIcons name={isPlayingTechVoice ? "stop-circle-outline" : "play-circle-outline"} size={20} color={isPlayingTechVoice ? '#FF3B30' : theme.text} />
                                    <Text style={[styles.audioBtnText, { color: isPlayingTechVoice ? '#FF3B30' : theme.text }]}>{isPlayingTechVoice ? 'PARAR AULA' : 'OUVIR O COACH'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === TABS.VIDEO && hasVideo && (
                            <View style={{ marginTop: 5, alignItems: 'center' }}>
                                <TechVideoPlayer videoUrl={techData.videoUrl} theme={theme} />
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: accentColor || theme.accent }]} onPress={onClose}>
                        <Text style={[styles.closeBtnText, { color: (techData && (techData.color === theme.accent || techData.color === '#00FF7F')) ? '#000' : '#FFF' }]}>ENTENDI, BORA MOER!</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 },
    contentCard: { width: '100%', alignSelf: 'center', padding: 25, borderRadius: 25, borderWidth: 1, maxHeight: '85%' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    title: { fontSize: 16, fontWeight: '900', marginBottom: 0, flex: 1, flexWrap: 'wrap' },
    divider: { height: 1, width: '100%', marginBottom: 15 },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
    tabBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },
    desc: { fontSize: 14, lineHeight: 22 },
    audioBtn: { marginTop: 0, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    audioBtnText: { fontWeight: 'bold', fontSize: 12 },
    closeBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    closeBtnText: { fontWeight: '900', fontSize: 14 }
});