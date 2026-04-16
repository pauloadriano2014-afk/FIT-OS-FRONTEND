// src/components/MontarTreino/WorkoutPreviewPanel.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from './SmartThumbnail';

// Habilita animação fluida no Android (no iOS já é nativo)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutPreviewPanel({ currentExercises, theme }) {
    const [expanded, setExpanded] = useState(false);

    if (!currentExercises || currentExercises.length === 0) return null;

    const toggleExpand = () => {
        // Animação suave estilo "Apple" ao abrir e fechar o carrinho
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    // Calcula o total de séries prescritas até agora
    const totalSets = currentExercises.reduce((acc, ex) => {
        return acc + (ex.blocks ? ex.blocks.length : 1);
    }, 0);

    return (
        <View style={[styles.wrapper, { shadowColor: theme.isDark ? '#000' : '#4DE38F' }]}>
            <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                
                {/* CABEÇALHO DO CARRINHO (Visão Retraída) */}
                <TouchableOpacity 
                    style={[styles.header, expanded && styles.headerExpanded, { backgroundColor: theme.surface }]} 
                    onPress={toggleExpand}
                    activeOpacity={0.8}
                >
                    <View style={styles.badgeRow}>
                        <View style={[styles.iconContainer, { backgroundColor: '#4DE38F' }]}>
                            <MaterialCommunityIcons name="dumbbell" size={18} color="#000" />
                        </View>
                        <View>
                            <Text style={[styles.title, { color: theme.text }]}>
                                {currentExercises.length} EXERCÍCIO{currentExercises.length > 1 ? 'S' : ''}
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>
                                {totalSets} SÉRIES TOTAIS NESTE DIA
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.toggleBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name={expanded ? "chevron-down" : "chevron-up"} size={20} color={theme.text} />
                    </View>
                </TouchableOpacity>

                {/* LISTA EXPANDIDA COM MINIATURAS */}
                {expanded && (
                    <View style={[styles.listContainer, { borderTopColor: theme.border }]}>
                        <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false} bounces={true}>
                            {currentExercises.map((ex, index) => {
                                const videoUrl = ex.exercise?.videoUrl || ex.videoUrl || "";
                                const setsCount = ex.blocks ? ex.blocks.length : 1;
                                
                                return (
                                    <View key={ex.tempId || index} style={[styles.listItem, { borderBottomColor: theme.bg }]}>
                                        <Text style={[styles.indexText, { color: theme.textSecondary }]}>{index + 1}.</Text>
                                        
                                        {/* A MINIATURA DE ELITE AQUI */}
                                        <View pointerEvents="none">
                                            <SmartThumbnail 
                                                url={videoUrl} 
                                                style={styles.thumb} 
                                                theme={theme} 
                                            />
                                        </View>

                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                                                {ex.title || ex.name || "Exercício"}
                                            </Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>
                                                {ex.category || "Geral"}
                                            </Text>
                                        </View>

                                        <View style={[styles.setBadge, { backgroundColor: theme.isDark ? '#4DE38F22' : '#4DE38F' }]}>
                                            <Text style={[styles.setBadgeText, { color: theme.isDark ? '#4DE38F' : '#000' }]}>{setsCount}x</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 15,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    container: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerExpanded: {
        borderBottomWidth: 0,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    toggleBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
        borderTopWidth: 1,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    indexText: {
        fontSize: 12,
        fontWeight: '900',
        width: 22,
    },
    thumb: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
    },
    setBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 10,
    },
    setBadgeText: {
        fontSize: 11,
        fontWeight: '900',
    }
});