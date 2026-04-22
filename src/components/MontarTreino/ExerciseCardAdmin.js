// src/components/MontarTreino/ExerciseCardAdmin.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import SmartThumbnail from './SmartThumbnail';

const HybridInput = ({ label, value, onChangeText, options, theme, isCardio, widthWeight = 1, keyboardType = 'default', onSubmitEditing, nextFocusRef, inputRef }) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <View style={[styles.inputBox, { flex: widthWeight, position: 'relative', zIndex: showDropdown ? 100 : 1 }]}>
            <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>{label}</Text>
            <TextInput
                ref={inputRef}
                style={[styles.miniInput, {
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: theme.text,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }]}
                value={String(value)}
                keyboardType={keyboardType}
                onChangeText={(v) => { onChangeText(v); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onSubmitEditing={() => {
                    setShowDropdown(false);
                    if (onSubmitEditing) onSubmitEditing();
                    else if (nextFocusRef?.current) nextFocusRef.current.focus();
                }}
                blurOnSubmit={!nextFocusRef}
            />
            {showDropdown && options && options.length > 0 && (
                <View style={[styles.hybridDropdown, {
                    backgroundColor: theme.surface,
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }]}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {options.map((opt, i) => {
                            if (opt.isTitle) {
                                return (
                                    <View key={`title-${i}`} style={[styles.dropdownTitle, {
                                        backgroundColor: theme.bg,
                                        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    }]}>
                                        <Text style={[styles.dropdownTitleText, { color: theme.accent }]}>{opt.label}</Text>
                                    </View>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={`opt-${i}`}
                                    style={[styles.hybridOption, {
                                        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                    }]}
                                    onPress={() => {
                                        onChangeText(String(opt.val));
                                        setShowDropdown(false);
                                        if (nextFocusRef?.current) nextFocusRef.current.focus();
                                    }}
                                >
                                    <Text style={[styles.hybridOptionText, { color: theme.text }]} numberOfLines={1}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const BlockRow = ({
    bloco, bIndex, index, isCardio, theme, atualizarBloco, removerBloco, adicionarBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible, workoutModel,
    OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, canRemove,
    blocksLength // 🔥 ADICIONADO PARA CALCULAR O Z-INDEX DECRESCENTE
}) => {
    const refSets = useRef(null);
    const refReps = useRef(null);
    const refRest = useRef(null);
    const refLoad = useRef(null);

    return (
        <View style={[styles.blockRow, {
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderLeftColor: isCardio ? theme.accent : theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
            zIndex: blocksLength - bIndex, // 🔥 O SEGREDO ESTÁ AQUI: O 1º bloco fica com zIndex maior que o 2º
            position: 'relative'
        }]}>
            <HybridInput
                inputRef={refSets}
                label={isCardio ? 'MINUTOS' : 'SÉRIES'}
                value={bloco.sets}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'sets', v)}
                options={OPTIONS_SETS}
                theme={theme} isCardio={isCardio}
                keyboardType="numeric"
                nextFocusRef={refReps}
            />
            <HybridInput
                inputRef={refReps}
                label={isCardio ? 'KCAL ALVO' : 'REPS'}
                value={bloco.reps}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'reps', v)}
                options={OPTIONS_REPS}
                theme={theme} isCardio={isCardio}
                keyboardType={isCardio ? 'numeric' : 'default'}
                nextFocusRef={workoutModel === 'CARGA' && !isCardio ? refLoad : (!isCardio ? refRest : null)}
            />
            {workoutModel === 'CARGA' && !isCardio && (
                <View style={styles.inputBox}>
                    <Text style={[styles.miniLabel, { color: theme.accent }]}>ALVO / CARGA</Text>
                    <TextInput
                        ref={refLoad}
                        style={[styles.miniInput, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            color: theme.accent,
                            borderColor: theme.accent + '60',
                        }]}
                        value={bloco.load || ''}
                        keyboardType="default"
                        placeholder="Ex: 15kg"
                        placeholderTextColor={theme.textSecondary}
                        onChangeText={(v) => atualizarBloco(index, bIndex, 'load', v)}
                        onSubmitEditing={() => refRest.current?.focus()}
                    />
                </View>
            )}
            {!isCardio && (
                <HybridInput
                    inputRef={refRest}
                    label="DESC(s)"
                    value={bloco.restTime}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'restTime', v)}
                    options={OPTIONS_REST}
                    theme={theme} isCardio={false}
                    keyboardType="numeric"
                    onSubmitEditing={() => adicionarBloco(index)}
                />
            )}
            <TouchableOpacity
                style={[styles.techBox, {
                    backgroundColor: bloco.technique
                        ? theme.accent + '15'
                        : theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderColor: bloco.technique
                        ? theme.accent + '50'
                        : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    flex: isCardio ? 1.5 : 1,
                }]}
                onPress={() => {
                    setIndexExercicioAtual(index);
                    setIndexBlocoAtual(bIndex);
                    setModalTecnicaVisible(true);
                }}
            >
                <Text style={[styles.miniLabel, { color: isCardio ? theme.accent : theme.textSecondary }]}>
                    {isCardio ? 'INTENSIDADE' : 'TÉCNICA'}
                </Text>
                <Text style={[styles.techValue, { color: bloco.technique ? theme.accent : theme.textSecondary }]} numberOfLines={1}>
                    {bloco.technique || (isCardio ? 'Moderada' : 'Normal')}
                </Text>
            </TouchableOpacity>
            {canRemove && (
                <TouchableOpacity onPress={() => removerBloco(index, bIndex)} style={styles.removeBlockBtn}>
                    <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function ExerciseCardAdmin({
    item, index, theme, drag, isActive,
    removeExercicio,
    setIsSelectingSubstitute, setTargetIndexForSubstitute, setModalBuscaVisible,
    removeSubstitute, atualizarBloco, adicionarBloco, removerBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    atualizarObservacao, openPreview, currentExercisesLength,
    setIsSwapping, setSwapIndex, setInitialCategoryFilter,
    workoutModel,
    moveExercise,
}) {
    const videoUrl = item.exercise?.videoUrl || item.videoUrl || '';
    const isCardio = item.category?.toUpperCase() === 'CARDIO';
    const isGhost = String(item.exerciseId || '').startsWith('custom_');
    const isWeb = Platform.OS === 'web';

    const [showObsDropdown, setShowObsDropdown] = useState(false);
    const [showPyramidDropdown, setShowPyramidDropdown] = useState(false);

    const QUICK_OBS = [
        'Faça até a falha',
        'Descanse apenas após executar com os 2 braços',
        'Descansar apenas após executar com as 2 pernas',
        'Pode mesclar os cardios, respeite as calorias',
        '30 a 60 segundos mantendo a posição',
        'Foque na fase excêntrica (descida controlada)',
        'Use carga máxima para a meta de reps',
    ];

    const OPTIONS_SETS = isCardio
        ? [{ val: 10, label: '10' }, { val: 15, label: '15' }, { val: 20, label: '20' }, { val: 30, label: '30' }, { val: 45, label: '45' }, { val: 60, label: '60' }]
        : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({ val: n, label: String(n) }));

    const OPTIONS_REPS = isCardio
        ? [{ val: 150, label: '150' }, { val: 200, label: '200' }, { val: 250, label: '250' }, { val: 300, label: '300' }, { val: 400, label: '400' }]
        : [{ val: 'FALHA', label: 'FALHA' }, { val: '6', label: '6' }, { val: '8', label: '8' }, { val: '10', label: '10' }, { val: '12', label: '12' }, { val: '15', label: '15' }, { val: '20', label: '20' }, { val: '30', label: '30' }];

    const OPTIONS_REST = [5, 10, 15, 30, 45, 60, 90, 120].map(n => ({ val: n, label: String(n) }));

    const cardContent = (
        <View style={[
            styles.card,
            {
                backgroundColor: isGhost
                    ? (theme.isDark ? '#2A0000' : '#FFF5F5')
                    : theme.surface,
                borderColor: isGhost ? '#FF3B3050' : 'transparent',
                borderWidth: isGhost ? 1 : 0,
                opacity: isActive ? 0.95 : 1,
            },
            !isGhost && Platform.select({
                ios: {
                    shadowColor: isActive ? theme.accent : '#000',
                    shadowOpacity: isActive ? 0.3 : (theme.isDark ? 0.3 : 0.07),
                    shadowRadius: isActive ? 20 : 16,
                    shadowOffset: { width: 0, height: isActive ? 8 : 5 },
                },
                android: { elevation: isActive ? 8 : 3 },
                web: {
                    boxShadow: isActive
                        ? `0 8px 32px rgba(0,0,0,0.2)`
                        : theme.isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 20px rgba(0,0,0,0.07)',
                },
            }),
        ]}>

            {/* DRAG HANDLE */}
            <View style={[styles.dragHandle, {
                backgroundColor: isActive
                    ? theme.accent + '18'
                    : theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }]}>
                {isWeb ? (
                    <View style={styles.webMoveRow}>
                        <Text style={[styles.dragHint, { color: theme.textSecondary }]}>#{index + 1}</Text>
                        <View style={styles.webArrows}>
                            <TouchableOpacity
                                onPress={() => moveExercise && moveExercise(index, 'up')}
                                style={[styles.webArrowBtn, {
                                    opacity: index === 0 ? 0.3 : 1,
                                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                }]}
                                disabled={index === 0}
                            >
                                <MaterialCommunityIcons name="chevron-up" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => moveExercise && moveExercise(index, 'down')}
                                style={[styles.webArrowBtn, {
                                    opacity: index === currentExercisesLength - 1 ? 0.3 : 1,
                                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                }]}
                                disabled={index === currentExercisesLength - 1}
                            >
                                <MaterialCommunityIcons name="chevron-down" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        onLongPress={drag}
                        delayLongPress={150}
                        style={styles.dragTouchable}
                        activeOpacity={0.6}
                    >
                        <MaterialCommunityIcons
                            name="drag-horizontal-variant"
                            size={20}
                            color={isActive ? theme.accent : theme.textSecondary}
                            style={{ opacity: isActive ? 1 : 0.5 }}
                        />
                        {isActive && (
                            <Text style={[styles.dragHint, { color: theme.accent }]}>Arraste para mover</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {/* ─── THUMBNAIL LATERAL ─── */}
            {!isGhost && (
                <TouchableOpacity
                    onPress={() => openPreview({ ...item, name: item.title, isAdded: true })}
                    style={[styles.thumbRow, {
                        borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    }]}
                    activeOpacity={0.8}
                >
                    <View style={styles.thumbSmall}>
                        <SmartThumbnail url={videoUrl} style={StyleSheet.absoluteFillObject} theme={theme} />
                        <View style={styles.thumbPlayOverlay}>
                            <MaterialCommunityIcons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                        </View>
                    </View>
                    <View style={styles.thumbInfo}>
                        {isCardio && (
                            <View style={styles.cardioBadge}>
                                <MaterialCommunityIcons name="heart-pulse" size={10} color={theme.accent} />
                                <Text style={[styles.cardioBadgeText, { color: theme.accent }]}>CARDIO</Text>
                            </View>
                        )}
                        <Text style={[styles.thumbTitle, { color: theme.text }]} numberOfLines={2}>
                            {index + 1}. {item.title}
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* CORPO DO CARD */}
            <View style={styles.cardBody}>

                {/* GHOST HEADER */}
                {isGhost && (
                    <View style={styles.ghostHeader}>
                        <View style={styles.ghostLeft}>
                            <Text style={[styles.ghostName, { color: '#FF3B30' }]}>{index + 1}. {item.title}</Text>
                            <View style={styles.ghostBadge}>
                                <Text style={styles.ghostBadgeText}>⚠️ NÃO VINCULADO</Text>
                            </View>
                        </View>
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                onPress={() => {
                                    setIsSwapping(true); setSwapIndex(index);
                                    if (item.category && setInitialCategoryFilter) setInitialCategoryFilter(item.category);
                                    setModalBuscaVisible(true);
                                }}
                                style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
                            >
                                <MaterialCommunityIcons name="link-variant-plus" size={18} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeExercicio(item.tempId)} style={styles.deleteBtn}>
                                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* AÇÕES */}
                {!isGhost && (
                    <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                            onPress={() => {
                                setIsSwapping(true); setSwapIndex(index);
                                if (item.category && setInitialCategoryFilter) setInitialCategoryFilter(item.category);
                                setModalBuscaVisible(true);
                            }}
                            style={[styles.swapBtn, {
                                backgroundColor: theme.accent + '18',
                                borderColor: theme.accent + '40',
                            }]}
                        >
                            <MaterialCommunityIcons name="sync" size={15} color={theme.accent} />
                            <Text style={[styles.swapBtnText, { color: theme.accent }]}>Trocar exercício</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeExercicio(item.tempId)} style={styles.deleteBtn}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* SUBSTITUTO */}
                {item.substitute ? (
                    <View style={[styles.substituteRow, {
                        backgroundColor: theme.accent + '10',
                        borderColor: theme.accent + '40',
                    }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={15} color={theme.accent} />
                        <Text style={[styles.subLabel, { color: theme.accent }]}>Ou:</Text>
                        <Text style={[styles.subName, { color: theme.text }]}>{item.substitute.name}</Text>
                        <TouchableOpacity onPress={() => removeSubstitute(index)}>
                            <MaterialCommunityIcons name="close-circle" size={17} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.addSubBtn}
                        onPress={() => {
                            setIsSelectingSubstitute(true);
                            setTargetIndexForSubstitute(index);
                            if (item.category && setInitialCategoryFilter) setInitialCategoryFilter(item.category);
                            setModalBuscaVisible(true);
                        }}
                    >
                        <MaterialCommunityIcons name="plus-circle-outline" size={13} color={theme.textSecondary} />
                        <Text style={[styles.addSubText, { color: theme.textSecondary }]}>Adicionar opção de troca</Text>
                    </TouchableOpacity>
                )}

                {/* BLOCOS */}
                <View style={[styles.blocksContainer, { zIndex: 999 }]}>
                    {item.blocks && item.blocks.map((bloco, bIndex) => (
                        <BlockRow
                            key={bIndex}
                            bloco={bloco} bIndex={bIndex} index={index}
                            isCardio={isCardio} theme={theme} workoutModel={workoutModel}
                            OPTIONS_SETS={OPTIONS_SETS} OPTIONS_REPS={OPTIONS_REPS} OPTIONS_REST={OPTIONS_REST}
                            atualizarBloco={atualizarBloco} removerBloco={removerBloco} adicionarBloco={adicionarBloco}
                            setIndexExercicioAtual={setIndexExercicioAtual} setIndexBlocoAtual={setIndexBlocoAtual}
                            setModalTecnicaVisible={setModalTecnicaVisible}
                            canRemove={item.blocks.length > 1}
                            blocksLength={item.blocks.length} // 🔥 PASSAMOS O VALOR PARA CÁ
                        />
                    ))}

                    {!isCardio && (
                        <View style={styles.addBlockRow}>
                            <TouchableOpacity
                                style={[styles.addBlockBtn, {
                                    backgroundColor: theme.accent + '10',
                                    borderColor: theme.accent + '40',
                                }]}
                                onPress={() => adicionarBloco(index)}
                            >
                                <MaterialCommunityIcons name="plus" size={15} color={theme.accent} />
                                <Text style={[styles.addBlockBtnText, { color: theme.accent }]}>Manual</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.addBlockBtn, {
                                    backgroundColor: theme.accent + '10',
                                    borderColor: theme.accent + '40',
                                }]}
                                onPress={() => setShowPyramidDropdown(!showPyramidDropdown)}
                            >
                                <MaterialCommunityIcons name="layers-triple" size={15} color={theme.accent} />
                                <Text style={[styles.addBlockBtnText, { color: theme.accent }]}>Pirâmide</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showPyramidDropdown && (
                        <View style={[styles.pyramidContainer, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }]}>
                            <Text style={[styles.pyramidLabel, { color: theme.textSecondary }]}>ESCOLHA A ESTRUTURA:</Text>
                            <View style={styles.pyramidBtns}>
                                {['12-10-8-8', '15-12-10-10', '15-12-12-10', '15-12-10-8', '12-12-10', '12-10-8'].map(p => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.pyramidBtn, {
                                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                            borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                        }]}
                                        onPress={() => { adicionarBloco(index, p); setShowPyramidDropdown(false); }}
                                    >
                                        <Text style={[styles.pyramidBtnText, { color: theme.text }]}>{p}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                {/* OBSERVAÇÃO */}
                <View style={styles.obsSection}>
                    <View style={styles.obsHeader}>
                        <Text style={[styles.miniLabel, { color: theme.textSecondary, marginBottom: 0 }]}>OBSERVAÇÃO</Text>
                        <TouchableOpacity
                            style={[styles.obsQuickBtn, {
                                backgroundColor: theme.accent + '15',
                                borderColor: theme.accent + '40',
                            }]}
                            onPress={() => setShowObsDropdown(!showObsDropdown)}
                        >
                            <MaterialCommunityIcons name="lightbulb-on" size={13} color={theme.accent} />
                            <Text style={[styles.obsQuickBtnText, { color: theme.accent }]}>
                                {showObsDropdown ? 'Fechar' : 'Inserir rápido'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showObsDropdown && (
                        <View style={[styles.obsDropdown, {
                            backgroundColor: theme.surface,
                            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        }]}>
                            <ScrollView nestedScrollEnabled style={{ maxHeight: 160 }} keyboardShouldPersistTaps="handled">
                                {QUICK_OBS.map((obsText, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.obsOption, {
                                            borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        }]}
                                        onPress={() => {
                                            const currentObs = item.observation || '';
                                            const separator = currentObs.length > 0 && !currentObs.endsWith(' ') ? ' - ' : '';
                                            atualizarObservacao(index, currentObs + separator + obsText);
                                            setShowObsDropdown(false);
                                        }}
                                    >
                                        <Text style={[styles.obsOptionText, { color: theme.text }]}>+ {obsText}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    <TextInput
                        style={[styles.obsInput, {
                            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            color: theme.text,
                            borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        }]}
                        placeholder="Adicionar observação ao aluno..."
                        placeholderTextColor={theme.textSecondary}
                        value={item.observation || ''}
                        onChangeText={(text) => atualizarObservacao(index, text)}
                        multiline
                    />
                </View>

            </View>
        </View>
    );

    if (!isWeb && drag) {
        return (
            <ScaleDecorator activeScale={1.02}>
                {cardContent}
            </ScaleDecorator>
        );
    }

    return cardContent;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        marginBottom: 14,
        overflow: 'hidden',
    },

    // DRAG HANDLE
    dragHandle: {
        height: 36,
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        height: '100%',
        width: '100%',
        justifyContent: 'center',
    },
    dragHint: {
        fontSize: 10,
        fontWeight: '600',
    },

    // WEB ARROWS
    webMoveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        width: '100%',
    },
    webArrows: {
        flexDirection: 'row',
        gap: 6,
    },
    webArrowBtn: {
        width: 26,
        height: 26,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ─── THUMBNAIL LATERAL ───
    thumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderBottomWidth: 1,
    },
    thumbSmall: {
        width: 90,
        height: 68,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#111',
        position: 'relative',
        flexShrink: 0,
    },
    thumbPlayOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    thumbInfo: {
        flex: 1,
        gap: 5,
    },
    thumbTitle: {
        fontSize: 14,
        fontWeight: '800',
        lineHeight: 19,
    },
    cardioBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.06)',
    },
    cardioBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },

    // CORPO
    cardBody: {
        padding: 14,
    },

    // GHOST
    ghostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    ghostLeft: {
        flex: 1,
        gap: 6,
    },
    ghostName: {
        fontSize: 14,
        fontWeight: '800',
    },
    ghostBadge: {
        backgroundColor: '#FF3B3020',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    ghostBadgeText: {
        color: '#FF3B30',
        fontSize: 9,
        fontWeight: '900',
    },

    // AÇÕES
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionBtn: {
        padding: 8,
        borderRadius: 10,
    },
    cardActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    swapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1,
    },
    swapBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    deleteBtn: {
        padding: 6,
    },

    // SUBSTITUTO
    substituteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        gap: 6,
    },
    subLabel: {
        fontSize: 11,
        fontWeight: '700',
    },
    subName: {
        fontSize: 13,
        flex: 1,
        fontWeight: '600',
    },
    addSubBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 4,
        marginBottom: 12,
    },
    addSubText: {
        fontSize: 12,
        fontStyle: 'italic',
    },

    // BLOCOS
    blocksContainer: {
        gap: 8,
        marginBottom: 16,
    },
    blockRow: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderLeftWidth: 3,
    },
    inputBox: {
        flex: 1,
    },
    miniLabel: {
        fontSize: 9,
        fontWeight: '800',
        marginBottom: 5,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    miniInput: {
        padding: 8,
        borderRadius: 8,
        fontSize: 15,
        textAlign: 'center',
        borderWidth: 1,
        fontWeight: '700',
        outlineStyle: 'none',
    },
    techBox: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 4,
        paddingVertical: 6,
    },
    techValue: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    removeBlockBtn: {
        padding: 6,
        borderRadius: 8,
    },

    // ADICIONAR BLOCO
    addBlockRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    addBlockBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 5,
    },
    addBlockBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // PIRÂMIDE
    pyramidContainer: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginTop: 4,
    },
    pyramidLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 10,
    },
    pyramidBtns: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    pyramidBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    pyramidBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // OBSERVAÇÃO
    obsSection: {
        marginTop: 4,
    },
    obsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    obsQuickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 7,
        borderWidth: 1,
    },
    obsQuickBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
    obsDropdown: {
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 10,
        overflow: 'hidden',
    },
    obsOption: {
        padding: 12,
        borderBottomWidth: 1,
    },
    obsOptionText: {
        fontSize: 13,
    },
    obsInput: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        fontSize: 14,
        minHeight: 42,
        textAlignVertical: 'top',
        outlineStyle: 'none',
    },

    // DROPDOWN
    hybridDropdown: {
        position: 'absolute',
        top: 58,
        width: 140,
        left: -20,
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 10,
        zIndex: 100,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    hybridOption: {
        padding: 11,
        borderBottomWidth: 1,
    },
    hybridOptionText: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    dropdownTitle: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    dropdownTitleText: {
        fontSize: 9,
        fontWeight: '900',
        textAlign: 'center',
    },
});