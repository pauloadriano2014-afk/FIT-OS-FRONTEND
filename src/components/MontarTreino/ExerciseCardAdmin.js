// src/components/MontarTreino/ExerciseCardAdmin.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SmartThumbnail from './SmartThumbnail';

// ─── SCANNER DE EQUIPAMENTOS ───
const getLoadCategoryKey = (name) => {
    const n = String(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (n.includes('caneleira') || n.includes('gluteo 4')) return 'caneleira';
    if (n.includes('halter') || n.includes('desenvolvimento') || n.includes('crucifixo') || n.includes('elevacao') || n.includes('rosca') || n.includes('triceps testa')) return 'halter';
    if (n.includes('leg') || n.includes('hack') || n.includes('agachamento') || n.includes('supino') || n.includes('terra') || n.includes('remada curvada') || n.includes('articulad')) return 'barra_pesada';
    if (n.includes('maquina') || n.includes('polia') || n.includes('cabo') || n.includes('cross') || n.includes('puxada') || n.includes('extensora') || n.includes('flexora') || n.includes('voador') || n.includes('peck') || n.includes('gluteo')) return 'maquina';
    if (n.includes('prancha') || n.includes('abdominal') || n.includes('livre') || n.includes('flexao') || n.includes('barra fixa')) return 'peso_corporal';
    return 'geral';
};

const getDefaultLoads = (key) => {
    switch (key) {
        case 'caneleira': return ['2kg', '4kg', '6kg', '8kg', '10kg', '12kg'];
        case 'halter': return ['2kg', '4kg', '6kg', '8kg', '10kg', '12kg', '14kg', '16kg', '18kg', '20kg'];
        case 'barra_pesada': return ['10kg', '20kg', '30kg', '40kg', '50kg', '60kg', '80kg', '100kg'];
        case 'maquina': return ['1 Placa', '2 Placas', '3 Placas', '4 Placas', '5 Placas', '6 Placas', '7 Placas', '8 Placas', '9 Placas', '10 Placas'];
        case 'peso_corporal': return ['Peso do Corpo', '+2kg', '+4kg', '+6kg', '+8kg', '+10kg'];
        default: return ['5kg', '10kg', '15kg', '20kg', '25kg', '30kg', '35kg', '40kg'];
    }
};

const QUICK_OBS = [
    "Focar na cadência (movimento lento)",
    "Amplitude máxima",
    "Pico de contração (segurar 2s)",
    "Carga progressiva",
    "Cuidado com a postura"
];

// ─── HYBRID INPUT (TextInput + Dropdown integrado) ───
const HybridInput = ({
    inputRef, label, value, onChangeText, options, theme,
    isCardio, keyboardType = 'default', nextFocusRef,
    onBlurAction, onDeleteOption, onSubmitEditing, flex = 1
}) => {
    const [open, setOpen] = useState(false);

    return (
        <View style={[styles.inputBox, { flex, zIndex: open ? 200 : 1 }]}>
            <Text style={[styles.miniLabel, {
                color: isCardio ? theme.accent : theme.textSecondary
            }]}>{label}</Text>
            <TextInput
                ref={inputRef}
                style={[styles.miniInput, {
                    color: theme.text,
                    borderColor: open
                        ? theme.accent
                        : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }]}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                    setTimeout(() => setOpen(false), 200);
                    onBlurAction?.();
                }}
                keyboardType={keyboardType}
                selectTextOnFocus
                returnKeyType="next"
                onSubmitEditing={() => {
                    onSubmitEditing?.();
                    nextFocusRef?.current?.focus();
                }}
            />
            {open && options && options.length > 0 && (
                <View style={[styles.hybridDropdown, {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                }]}>
                    <ScrollView
                        nestedScrollEnabled
                        style={{ maxHeight: 160 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {options.map((opt, i) => {
                            if (opt.isTitle) return (
                                <View key={i} style={[styles.dropdownTitle, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.dropdownTitleText, { color: theme.textSecondary }]}>{opt.label}</Text>
                                </View>
                            );
                            return (
                                <View key={i} style={[styles.hybridOptionContainer, {
                                    borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                }]}>
                                    <TouchableOpacity
                                        style={styles.hybridOptionClick}
                                        onPress={() => {
                                            onChangeText(opt.val ?? opt.label);
                                            setOpen(false);
                                        }}
                                    >
                                        <Text style={[styles.hybridOptionText, {
                                            color: value === (opt.val ?? opt.label) ? theme.accent : theme.text
                                        }]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                    {opt.isDeletable && onDeleteOption && (
                                        <TouchableOpacity
                                            style={styles.hybridOptionDelete}
                                            onPress={() => onDeleteOption(opt.val ?? opt.label)}
                                        >
                                            <MaterialCommunityIcons name="close" size={14} color="#FF3B30" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

// ─── BLOCK ROW (com suporte correto a cardio) ───
const BlockRow = ({
    bloco, bIndex, index, isCardio, theme, workoutModel,
    OPTIONS_SETS, OPTIONS_REPS, OPTIONS_REST, OPTIONS_LOAD,
    saveCustomLoad, removeCustomLoad,
    atualizarBloco, removerBloco,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    canRemove, blocksLength
}) => {
    const refSets = useRef(null);
    const refReps = useRef(null);
    const refRest = useRef(null);
    const refLoad = useRef(null);

    return (
        <View style={[styles.blockRow, {
            backgroundColor: isCardio
                ? (theme.isDark ? `${theme.accent}12` : `${theme.accent}08`)
                : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
            borderLeftColor: isCardio
                ? theme.accent
                : theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
            zIndex: blocksLength - bIndex,
            position: 'relative'
        }]}>
            {/* SÉRIES ou MINUTOS */}
            <HybridInput
                inputRef={refSets}
                label={isCardio ? 'MINUTOS' : 'SÉRIES'}
                value={bloco.sets}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'sets', v)}
                options={OPTIONS_SETS}
                theme={theme}
                isCardio={isCardio}
                keyboardType="numeric"
                nextFocusRef={refReps}
                flex={isCardio ? 1.2 : 0.8}
            />

            {/* REPS ou KCAL ALVO */}
            <HybridInput
                inputRef={refReps}
                label={isCardio ? 'KCAL ALVO' : 'REPS'}
                value={bloco.reps}
                onChangeText={(v) => atualizarBloco(index, bIndex, 'reps', v)}
                options={OPTIONS_REPS}
                theme={theme}
                isCardio={isCardio}
                keyboardType={isCardio ? 'numeric' : 'default'}
                nextFocusRef={workoutModel === 'CARGA' && !isCardio ? refLoad : (!isCardio ? refRest : null)}
                flex={isCardio ? 1.4 : 1.2}
            />

            {/* CARGA (só para musculação com modelo CARGA) */}
            {workoutModel === 'CARGA' && !isCardio && (
                <HybridInput
                    inputRef={refLoad}
                    label="ALVO / CARGA"
                    value={bloco.load || ''}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'load', v)}
                    options={OPTIONS_LOAD}
                    theme={theme}
                    isCardio={false}
                    keyboardType="default"
                    nextFocusRef={refRest}
                    onBlurAction={() => saveCustomLoad(bloco.load)}
                    onDeleteOption={removeCustomLoad}
                    onSubmitEditing={() => saveCustomLoad(bloco.load)}
                    flex={1.4}
                />
            )}

            {/* PAUSA (só para musculação) */}
            {!isCardio && (
                <HybridInput
                    inputRef={refRest}
                    label="PAUSA"
                    value={bloco.restTime}
                    onChangeText={(v) => atualizarBloco(index, bIndex, 'restTime', v)}
                    options={OPTIONS_REST}
                    theme={theme}
                    isCardio={false}
                    keyboardType="numeric"
                    flex={1}
                />
            )}

            {/* TÉCNICA (só para musculação) */}
            {!isCardio && (
                <View style={[styles.inputBox, { flex: 1.2 }]}>
                    <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TÉCNICA</Text>
                    <TouchableOpacity
                        style={[styles.techBox, {
                            backgroundColor: bloco.technique
                                ? theme.accent + '20'
                                : theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            borderColor: bloco.technique
                                ? theme.accent
                                : theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        }]}
                        onPress={() => {
                            setIndexExercicioAtual(index);
                            setIndexBlocoAtual(bIndex);
                            setModalTecnicaVisible(true);
                        }}
                    >
                        <Text style={[styles.techValue, { color: bloco.technique ? theme.accent : theme.text }]} numberOfLines={1}>
                            {bloco.technique || 'Normal'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {canRemove && (
                <TouchableOpacity onPress={() => removerBloco(index, bIndex)} style={styles.removeBlockBtn}>
                    <MaterialCommunityIcons name="close" size={16} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </View>
    );
};

// ─── COMPONENTE PRINCIPAL ───
export default function ExerciseCardAdmin({
    item, index, drag, isActive, theme,
    atualizarBloco, removerBloco, adicionarBloco,
    removeExercicio, removeSubstitute, atualizarObservacao,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    setIsSelectingSubstitute, setTargetIndexForSubstitute, setModalBuscaVisible,
    setIsSwapping, setSwapIndex, openPreview,
    workoutModel, moveExerciseWeb, setInitialCategoryFilter
}) {
    const isWeb = Platform.OS === 'web';
    const isCardio = item.category?.toUpperCase() === 'CARDIO';
    const isGhost = item.exerciseId && String(item.exerciseId).startsWith('custom_');

    const [showPyramidDropdown, setShowPyramidDropdown] = useState(false);
    const [showObsDropdown, setShowObsDropdown] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [customLoads, setCustomLoads] = useState([]);
    const loadCategoryKey = getLoadCategoryKey(item.title);

    useEffect(() => {
        const loadSavedLoads = async () => {
            try {
                const saved = await AsyncStorage.getItem(`@custom_loads_${loadCategoryKey}`);
                if (saved) {
                    setCustomLoads(JSON.parse(saved));
                } else {
                    const defaults = getDefaultLoads(loadCategoryKey);
                    setCustomLoads(defaults);
                    await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(defaults));
                }
            } catch (e) { console.log(e); }
        };
        loadSavedLoads();
    }, [loadCategoryKey]);

    const saveCustomLoad = async (newLoad) => {
        if (!newLoad || newLoad.trim() === '') return;
        const formatted = newLoad.trim();
        if (!customLoads.includes(formatted)) {
            const updated = [formatted, ...customLoads].slice(0, 15);
            setCustomLoads(updated);
            try { await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(updated)); } catch (e) {}
        }
    };

    const removeCustomLoad = async (loadToRemove) => {
        const updated = customLoads.filter(l => l !== loadToRemove);
        setCustomLoads(updated);
        try { await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(updated)); } catch (e) {}
    };

    // ─── OPTIONS ───
    const OPTIONS_SETS = isCardio ? [
        { label: '10 min', val: '10' }, { label: '15 min', val: '15' },
        { label: '20 min', val: '20' }, { label: '30 min', val: '30' },
        { label: '45 min', val: '45' }, { label: '60 min', val: '60' },
    ] : [
        { label: '1', val: '1' }, { label: '2', val: '2' }, { label: '3', val: '3' },
        { label: '4', val: '4' }, { label: '5', val: '5' }, { label: '6', val: '6' },
    ];

    const OPTIONS_REPS = isCardio ? [
        { label: '100 kcal', val: '100' }, { label: '150 kcal', val: '150' },
        { label: '200 kcal', val: '200' }, { label: '250 kcal', val: '250' },
        { label: '300 kcal', val: '300' }, { label: '400 kcal', val: '400' },
        { label: '500 kcal', val: '500' },
    ] : [
        { label: 'Até a falha', val: 'Falha' }, { label: 'Máx', val: 'Máx' },
        { label: '6', val: '6' }, { label: '8', val: '8' },
        { label: '10', val: '10' }, { label: '12', val: '12' },
        { label: '15', val: '15' }, { label: '20', val: '20' },
        { label: '6 a 8', val: '6-8' }, { label: '8 a 10', val: '8-10' },
        { label: '10 a 12', val: '10-12' }, { label: '12 a 15', val: '12-15' },
        { label: '15 a 20', val: '15-20' },
    ];

    const OPTIONS_REST = [
        { label: 'Sem pausa', val: '0' }, { label: '30s', val: '30' },
        { label: '45s', val: '45' }, { label: '60s (1 min)', val: '60' },
        { label: '90s (1.5 min)', val: '90' }, { label: '120s (2 min)', val: '120' },
        { label: '3 min', val: '180' },
    ];

    const OPTIONS_LOAD = [
        { label: 'SUAS CARGAS SALVAS', isTitle: true },
        ...customLoads.map(l => ({ label: l, val: l, isDeletable: true }))
    ];

    // ─── DRAG HANDLE / WEB ARROWS ───
    const dragHandleContent = isWeb ? (
        // 🔥 BOTÕES COLORIDOS E EVIDENTES NO WEB 🔥
        <View style={styles.webMoveRow}>
            <TouchableOpacity
                style={[styles.webMoveBtn, {
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                }]}
                onPress={() => moveExerciseWeb(index, -1)}
            >
                <MaterialCommunityIcons name="arrow-up" size={13} color={theme.textSecondary} />
                <Text style={[styles.webMoveBtnText, { color: theme.textSecondary }]}>Mover para cima</Text>
            </TouchableOpacity>

            <View style={[styles.webMoveDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
                style={[styles.webMoveBtn, {
                    backgroundColor: isExpanded ? theme.accent + '18' : (theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                    borderColor: isExpanded ? theme.accent + '40' : (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'),
                }]}
                onPress={() => setIsExpanded(!isExpanded)}
            >
                <MaterialCommunityIcons
                    name={isExpanded ? 'unfold-less-horizontal' : 'unfold-more-horizontal'}
                    size={13}
                    color={isExpanded ? theme.accent : theme.textSecondary}
                />
                <Text style={[styles.webMoveBtnText, {
                    color: isExpanded ? theme.accent : theme.textSecondary
                }]}>
                    {isExpanded ? 'Minimizar' : 'Expandir'}
                </Text>
            </TouchableOpacity>

            <View style={[styles.webMoveDivider, { backgroundColor: theme.border }]} />

            <TouchableOpacity
                style={[styles.webMoveBtn, {
                    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                }]}
                onPress={() => moveExerciseWeb(index, 1)}
            >
                <MaterialCommunityIcons name="arrow-down" size={13} color={theme.textSecondary} />
                <Text style={[styles.webMoveBtnText, { color: theme.textSecondary }]}>Mover para baixo</Text>
            </TouchableOpacity>
        </View>
    ) : (
        <TouchableOpacity onLongPress={drag} style={styles.dragTouchable} delayLongPress={150}>
            <MaterialCommunityIcons name="drag-horizontal-variant" size={20} color={theme.textSecondary} />
            <Text style={[styles.dragHint, { color: theme.textSecondary }]}>Segure para reordenar</Text>
        </TouchableOpacity>
    );

    const cardContent = (
        <View style={[styles.card, {
            backgroundColor: theme.surface,
            borderColor: isActive ? theme.accent : (isCardio ? theme.accent + '40' : theme.border),
            borderWidth: isActive ? 2 : 1,
            opacity: isGhost ? 0.8 : 1,
            ...Platform.select({
                web: { boxShadow: isActive ? `0 0 0 2px ${theme.accent}` : '0 2px 10px rgba(0,0,0,0.05)' },
                default: { elevation: isActive ? 8 : 2 }
            })
        }]}>

            {/* DRAG HANDLE */}
            <View style={[styles.dragHandle, {
                backgroundColor: isCardio
                    ? (theme.isDark ? `${theme.accent}10` : `${theme.accent}08`)
                    : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                borderBottomColor: theme.border
            }]}>
                {dragHandleContent}
            </View>

            {/* THUMBNAIL E TÍTULO */}
            {!isGhost && (
                <View style={[styles.thumbRow, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity style={styles.thumbSmall} onPress={() => openPreview(item)}>
                        <SmartThumbnail
                            url={item.exercise?.videoUrl || item.videoUrl}
                            style={StyleSheet.absoluteFillObject}
                            theme={theme}
                        />
                        <View style={styles.thumbPlayOverlay}>
                            <MaterialCommunityIcons name="play-circle" size={28} color="rgba(255,255,255,0.9)" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.thumbInfo}>
                        {isCardio && (
                            <View style={[styles.cardioBadge, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="heart-pulse" size={10} color={theme.accent} />
                                <Text style={[styles.cardioBadgeText, { color: theme.accent }]}>CARDIO</Text>
                            </View>
                        )}
                        <Text style={[styles.thumbTitle, { color: theme.text }]} numberOfLines={2}>
                            {index + 1}. {item.title}
                        </Text>
                    </View>
                    {/* Botão minimizar no mobile */}
                    {!isWeb && (
                        <TouchableOpacity
                            style={[styles.mobileExpandBtn, {
                                backgroundColor: isExpanded
                                    ? theme.accent + '18'
                                    : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                            }]}
                            onPress={() => setIsExpanded(!isExpanded)}
                        >
                            <MaterialCommunityIcons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={isExpanded ? theme.accent : theme.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* CORPO (escondido se minimizado) */}
            {isExpanded && (
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
                                        if (item.category && setInitialCategoryFilter) {
                                            setInitialCategoryFilter(item.category, item.subCategory);
                                        }
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
                                    if (item.category && typeof setInitialCategoryFilter === 'function') {
                                        setInitialCategoryFilter(item.category, item.subCategory);
                                    }
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
                                if (item.category && typeof setInitialCategoryFilter === 'function') {
                                    setInitialCategoryFilter(item.category, item.subCategory);
                                }
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
                                OPTIONS_SETS={OPTIONS_SETS} OPTIONS_REPS={OPTIONS_REPS}
                                OPTIONS_REST={OPTIONS_REST} OPTIONS_LOAD={OPTIONS_LOAD}
                                saveCustomLoad={saveCustomLoad} removeCustomLoad={removeCustomLoad}
                                atualizarBloco={atualizarBloco} removerBloco={removerBloco}
                                adicionarBloco={adicionarBloco}
                                setIndexExercicioAtual={setIndexExercicioAtual}
                                setIndexBlocoAtual={setIndexBlocoAtual}
                                setModalTecnicaVisible={setModalTecnicaVisible}
                                canRemove={item.blocks.length > 1}
                                blocksLength={item.blocks.length}
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
            )}
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

    // ─── DRAG HANDLE ───
    dragHandle: {
        minHeight: 38,
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        height: 38,
        width: '100%',
        justifyContent: 'center',
    },
    dragHint: {
        fontSize: 10,
        fontWeight: '600',
    },

    // 🔥 WEB MOVE BUTTONS (coloridos e evidentes) ───
    webMoveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
        width: '100%',
    },
    webMoveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    webMoveBtnText: {
        fontSize: 11,
        fontWeight: '700',
    },
    webMoveDivider: {
        width: 1,
        height: 16,
        marginHorizontal: 2,
    },

    // ─── THUMBNAIL ───
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
    },
    cardioBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    mobileExpandBtn: {
        padding: 8,
        borderRadius: 8,
    },

    // ─── CORPO ───
    cardBody: {
        padding: 14,
    },

    // ─── GHOST ───
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

    // ─── AÇÕES ───
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

    // ─── SUBSTITUTO ───
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

    // ─── BLOCOS ───
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
        fontSize: 16,
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

    // ─── ADICIONAR BLOCO ───
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

    // ─── PIRÂMIDE ───
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

    // ─── OBSERVAÇÃO ───
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
        fontSize: 16,
        minHeight: 42,
        textAlignVertical: 'top',
        outlineStyle: 'none',
    },

    // ─── HYBRID DROPDOWN ───
    hybridDropdown: {
        position: 'absolute',
        top: 60,
        left: -10,
        width: 150,
        maxHeight: 200,
        borderWidth: 1,
        borderRadius: 10,
        zIndex: 300,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
    },
    hybridOptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    hybridOptionClick: {
        flex: 1,
        padding: 11,
    },
    hybridOptionDelete: {
        padding: 11,
        justifyContent: 'center',
        alignItems: 'center',
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