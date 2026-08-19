// src/components/MontarTreino/ExerciseCardAdmin.js
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── SUBCOMPONENTES ───
import ExerciseCardHeader from './ExerciseCard/ExerciseCardHeader';
import ExerciseCardActions from './ExerciseCard/ExerciseCardActions';
import SubstitutesList from './ExerciseCard/SubstitutesList';
import BlocksSection from './ExerciseCard/BlocksSection';
import ObservationSection from './ExerciseCard/ObservationSection';

// ─── CONSTANTS ───
import {
    getLoadCategoryKey, getDefaultLoads,
    OPTIONS_SETS_CARDIO, OPTIONS_SETS_NORMAL,
    OPTIONS_REPS_CARDIO, OPTIONS_REPS_NORMAL,
    OPTIONS_REST,
} from './ExerciseCard/_constants';

export default function ExerciseCardAdmin({
    item, index, drag, isActive, theme,
    atualizarBloco, removerBloco, adicionarBloco,
    removeExercicio, removeSubstitute, atualizarObservacao,
    setIndexExercicioAtual, setIndexBlocoAtual, setModalTecnicaVisible,
    setIsSelectingSubstitute, setTargetIndexForSubstitute, setModalBuscaVisible,
    setIsSwapping, setSwapIndex, openPreview,
    workoutModel, moveExercise, setInitialCategoryFilter,
    collapseSignal,
    listaTecnicas = [], // 🔥 NOVA PROP: Recebe os combos criados
}) {
    const isWeb = Platform.OS === 'web';
    const isCardio = item.category?.toUpperCase() === 'CARDIO';
    const isGhost = item.exerciseId && String(item.exerciseId).startsWith('custom_');
    const loadCategoryKey = getLoadCategoryKey(item.title);

    const [isExpanded, setIsExpanded] = useState(true);
    const [customLoads, setCustomLoads] = useState([]);

    // Normaliza substitutos: suporta substitute (único) e substitutes (array)
    const substitutesList = [];
    if (item.substitutes && Array.isArray(item.substitutes)) substitutesList.push(...item.substitutes);
    else if (item.substitute) substitutesList.push(item.substitute);

    // Colapsar/expandir todos (botão "Minimizar/Expandir" do dia atual) —
    // guarda o "seq" com que este card nasceu e só reage quando o seq muda
    // DEPOIS de montado. Sem isso, um card recém-montado (ex: trocou de dia)
    // herdava o último clique feito enquanto via outro dia, porque o efeito
    // também dispara no mount — daí o botão "vazava" pra outros treinos.
    const birthSeqRef = useRef(collapseSignal?.seq ?? 0);
    useEffect(() => {
        if (collapseSignal && collapseSignal.seq !== birthSeqRef.current) {
            setIsExpanded(collapseSignal.expand);
        }
    }, [collapseSignal]);

    // Cargas salvas
    useEffect(() => {
        const load = async () => {
            try {
                const saved = await AsyncStorage.getItem(`@custom_loads_${loadCategoryKey}`);
                if (saved) setCustomLoads(JSON.parse(saved));
                else {
                    const defaults = getDefaultLoads(loadCategoryKey);
                    setCustomLoads(defaults);
                    await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(defaults));
                }
            } catch (e) {}
        };
        load();
    }, [loadCategoryKey]);

    const saveCustomLoad = async (newLoad) => {
        if (!newLoad || !newLoad.trim()) return;
        const fmt = newLoad.trim();
        if (!customLoads.includes(fmt)) {
            const updated = [fmt, ...customLoads].slice(0, 15);
            setCustomLoads(updated);
            try { await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(updated)); } catch (e) {}
        }
    };

    const removeCustomLoad = async (val) => {
        const updated = customLoads.filter(l => l !== val);
        setCustomLoads(updated);
        try { await AsyncStorage.setItem(`@custom_loads_${loadCategoryKey}`, JSON.stringify(updated)); } catch (e) {}
    };

    // Options
    const OPTIONS_SETS = isCardio ? OPTIONS_SETS_CARDIO : OPTIONS_SETS_NORMAL;
    const OPTIONS_REPS = isCardio ? OPTIONS_REPS_CARDIO : OPTIONS_REPS_NORMAL;
    const OPTIONS_LOAD = [
        { label: 'SUAS CARGAS SALVAS', isTitle: true },
        ...customLoads.map(l => ({ label: l, val: l, isDeletable: true })),
    ];

    // Handler: trocar exercício
    const handleSwap = () => {
        setIsSwapping(true);
        setSwapIndex(index);
        if (item.category && typeof setInitialCategoryFilter === 'function') setInitialCategoryFilter(item.category, item.subCategory);
        setModalBuscaVisible(true);
    };

    // Handler: adicionar substituto
    const handleAddSubstitute = () => {
        setIsSelectingSubstitute(true);
        setTargetIndexForSubstitute(index);
        if (item.category && typeof setInitialCategoryFilter === 'function') setInitialCategoryFilter(item.category, item.subCategory);
        setModalBuscaVisible(true);
    };

    // Item enriquecido com callbacks de mover (para ExerciseCardHeader web)
    const enrichedItem = {
        ...item,
        onMoveUp: () => moveExercise(item.tempId, 'up'),
        onMoveDown: () => moveExercise(item.tempId, 'down'),
    };

    const cardContent = (
        <View style={[S.card, {
            backgroundColor: theme.surface,
            borderColor: isActive ? theme.accent : (isCardio ? theme.accent + '40' : theme.border),
            borderWidth: isActive ? 2 : 1,
            opacity: isGhost ? 0.8 : 1,
            ...Platform.select({
                web: { boxShadow: isActive ? `0 0 0 2px ${theme.accent}` : '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', borderRadius: 18 },
                default: { elevation: isActive ? 8 : 2 },
            }),
        }]}>
            {/* HEADER: drag handle + thumbnail + título */}
            {!isGhost && (
                <ExerciseCardHeader
                    item={enrichedItem} index={index} theme={theme}
                    isCardio={isCardio} isExpanded={isExpanded}
                    onToggleExpand={() => setIsExpanded(!isExpanded)}
                    onPreview={() => openPreview(item)}
                    drag={drag}
                />
            )}

            {/* CORPO */}
            {isExpanded && (
                <View style={S.body}>
                    {/* Ações: trocar / lixeira / ghost header */}
                    <ExerciseCardActions
                        item={item} index={index} theme={theme}
                        isGhost={isGhost}
                        onSwap={handleSwap}
                        onDelete={() => removeExercicio(item.tempId)}
                    />

                    {/* Substitutos */}
                    {!isGhost && (
                        <SubstitutesList
                            substitutesList={substitutesList}
                            index={index} theme={theme}
                            onRemove={removeSubstitute}
                            onAdd={handleAddSubstitute}
                        />
                    )}

                    {/* Blocos */}
                    <BlocksSection
                        blocks={item.blocks} index={index}
                        isCardio={isCardio} theme={theme} workoutModel={workoutModel}
                        OPTIONS_SETS={OPTIONS_SETS} OPTIONS_REPS={OPTIONS_REPS}
                        OPTIONS_REST={OPTIONS_REST} OPTIONS_LOAD={OPTIONS_LOAD}
                        saveCustomLoad={saveCustomLoad} removeCustomLoad={removeCustomLoad}
                        atualizarBloco={atualizarBloco} removerBloco={removerBloco}
                        adicionarBloco={adicionarBloco}
                        setIndexExercicioAtual={setIndexExercicioAtual}
                        setIndexBlocoAtual={setIndexBlocoAtual}
                        setModalTecnicaVisible={setModalTecnicaVisible}
                        listaTecnicas={listaTecnicas} // 🔥 PROP REPASSADA PARA ONDE REALMENTE IMPORTA
                    />

                    {/* Observação */}
                    <ObservationSection
                        item={item} index={index} theme={theme}
                        atualizarObservacao={atualizarObservacao}
                    />
                </View>
            )}
        </View>
    );

    if (!isWeb && drag) {
        return <ScaleDecorator activeScale={1.02}>{cardContent}</ScaleDecorator>;
    }
    return cardContent;
}

const S = StyleSheet.create({
    card: { borderRadius: 18, marginBottom: 14, overflow: Platform.OS === 'web' ? 'visible' : 'hidden' },
    body: { padding: 14 },
});