// src/components/MontarTreino/WorkoutPreviewPanel.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SmartThumbnail from './SmartThumbnail';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutPreviewPanel({ currentExercises, theme }) {
    const [expanded, setExpanded] = useState(false);

    if (!currentExercises || currentExercises.length === 0) return null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const totalSets = currentExercises.reduce((acc, ex) => {
        return acc + (ex.blocks ? ex.blocks.length : 1);
    }, 0);

    return (
        <View style={[
            styles.wrapper,
            Platform.select({
                ios: {
                    shadowColor: theme.accent,
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 8 },
                },
                android: { elevation: 16 },
                web: {
                    boxShadow: `0 8px 32px rgba(0,0,0,0.25)`,
                },
            }),
        ]}>
            <View style={[styles.container, {
                backgroundColor: theme.surface,
                borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }]}>

                {/* CABEÇALHO */}
                <TouchableOpacity
                    style={styles.header}
                    onPress={toggleExpand}
                    activeOpacity={0.8}
                >
                    <View style={styles.headerLeft}>
                        <View style={[styles.iconBox, { backgroundColor: theme.accent }]}>
                            <MaterialCommunityIcons name="dumbbell" size={17} color={theme.isDark ? '#000' : '#FFF'} />
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>
                                {currentExercises.length} exercício{currentExercises.length > 1 ? 's' : ''}
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                                {totalSets} série{totalSets > 1 ? 's' : ''} neste dia
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.toggleBtn, {
                        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    }]}>
                        <MaterialCommunityIcons
                            name={expanded ? 'chevron-down' : 'chevron-up'}
                            size={20}
                            color={theme.textSecondary}
                        />
                    </View>
                </TouchableOpacity>

                {/* LISTA EXPANDIDA */}
                {expanded && (
                    <View style={[styles.listContainer, {
                        borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]}>
                        <ScrollView
                            style={{ maxHeight: 260 }}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {currentExercises.map((ex, index) => {
                                const videoUrl = ex.exercise?.videoUrl || ex.videoUrl || '';
                                const setsCount = ex.blocks ? ex.blocks.length : 1;
                                const isLast = index === currentExercises.length - 1;

                                return (
                                    <View
                                        key={ex.tempId || index}
                                        style={[styles.listItem, {
                                            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            borderBottomWidth: isLast ? 0 : 1,
                                        }]}
                                    >
                                        {/* NÚMERO */}
                                        <View style={[styles.indexBox, {
                                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                        }]}>
                                            <Text style={[styles.indexText, { color: theme.textSecondary }]}>
                                                {index + 1}
                                            </Text>
                                        </View>

                                        {/* THUMBNAIL */}
                                        <View pointerEvents="none">
                                            <SmartThumbnail
                                                url={videoUrl}
                                                style={styles.thumb}
                                                theme={theme}
                                            />
                                        </View>

                                        {/* NOME E CATEGORIA */}
                                        <View style={styles.itemInfo}>
                                            <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                                                {ex.title || ex.name || 'Exercício'}
                                            </Text>
                                            <Text style={[styles.itemCategory, { color: theme.textSecondary }]}>
                                                {ex.category || 'Geral'}
                                            </Text>
                                        </View>

                                        {/* BADGE DE SÉRIES */}
                                        <View style={[styles.setBadge, {
                                            backgroundColor: theme.accent + '18',
                                        }]}>
                                            <Text style={[styles.setBadgeText, { color: theme.accent }]}>
                                                {setsCount}x
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        {/* RODAPÉ COM TOTAIS */}
                        <View style={[styles.footer, {
                            borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        }]}>
                            <View style={styles.footerItem}>
                                <Text style={[styles.footerValue, { color: theme.text }]}>
                                    {currentExercises.length}
                                </Text>
                                <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>
                                    exercícios
                                </Text>
                            </View>
                            <View style={[styles.footerDivider, {
                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            }]} />
                            <View style={styles.footerItem}>
                                <Text style={[styles.footerValue, { color: theme.text }]}>
                                    {totalSets}
                                </Text>
                                <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>
                                    séries totais
                                </Text>
                            </View>
                            <View style={[styles.footerDivider, {
                                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            }]} />
                            <View style={styles.footerItem}>
                                <Text style={[styles.footerValue, { color: theme.accent }]}>
                                    {currentExercises.filter(ex => ex.category?.toUpperCase() === 'CARDIO').length > 0
                                        ? `${currentExercises.filter(ex => ex.category?.toUpperCase() === 'CARDIO').length} cardio`
                                        : `${currentExercises.filter(ex => ex.substitute).length} trocas`
                                    }
                                </Text>
                                <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>
                                    {currentExercises.filter(ex => ex.category?.toUpperCase() === 'CARDIO').length > 0
                                        ? 'no dia'
                                        : 'opcionais'
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        zIndex: 9999,
    },
    container: {
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
    },

    // HEADER
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '500',
    },
    toggleBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // LISTA
    listContainer: {
        borderTopWidth: 1,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    indexBox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    indexText: {
        fontSize: 11,
        fontWeight: '800',
    },
    thumb: {
        width: 44,
        height: 44,
        borderRadius: 11,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 3,
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
    },
    itemCategory: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    setBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    setBadgeText: {
        fontSize: 12,
        fontWeight: '900',
    },

    // RODAPÉ
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
    },
    footerItem: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    footerValue: {
        fontSize: 15,
        fontWeight: '900',
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    footerDivider: {
        width: 1,
        height: 28,
        marginHorizontal: 8,
    },
});