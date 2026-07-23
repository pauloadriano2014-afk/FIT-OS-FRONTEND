// src/components/AdminDiet/MacroTuningModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function MacroTuningModal({ visible, onClose, theme, visibleMeals, onApply, canUndo, onUndo }) {
    const [scope, setScope] = useState('ALL'); // 'ALL' ou meal.id
    const [targetMacro, setTargetMacro] = useState('ALL'); // 'ALL', 'CARB', 'PROT', 'FAT'
    
    // 🔥 Transformado em String para o campo de digitação fluir perfeitamente
    const [percentage, setPercentage] = useState('10'); 

    // Inteligência que identifica a vocação principal do alimento (fonte de quê?)
    const getDominantMacro = (item) => {
        const c = Number(item.carb || 0);
        const p = Number(item.prot || 0);
        const f = Number(item.fat || 0);
        if (c >= p && c >= f) return 'CARB';
        if (p > c && p >= f) return 'PROT';
        if (f > c && f > p) return 'FAT';
        return 'ALL';
    };

    const handleApplyTuning = (isIncrease) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Converte pra número e previne erro se o cara tentar aplicar com o campo vazio
        const numPct = parseInt(percentage, 10) || 0;
        if (numPct === 0) return;

        const multiplier = isIncrease ? (1 + numPct / 100) : (1 - numPct / 100);

        const updatedMeals = visibleMeals.map(meal => {
            // Se o escopo for uma refeição específica e não for esta, ignora
            if (scope !== 'ALL' && meal.id !== scope) return meal;

            const updatedItems = meal.items.map(item => {
                const dominant = getDominantMacro(item);
                // Se o ajuste for para um macro específico e este alimento não for fonte dele, ignora
                if (targetMacro !== 'ALL' && dominant !== targetMacro) return item;

                // Função que recalcula gramas e macros proporcionalmente
                const scaleObj = (obj) => ({
                    ...obj,
                    amount: String(Math.round(Number(obj.amount) * multiplier)),
                    kcal: Number((Number(obj.kcal) * multiplier).toFixed(1)),
                    carb: Number((Number(obj.carb) * multiplier).toFixed(1)),
                    prot: Number((Number(obj.prot) * multiplier).toFixed(1)),
                    fat: Number((Number(obj.fat) * multiplier).toFixed(1)),
                });

                // Aplica no alimento principal
                const scaledItem = scaleObj(item);

                // Aplica a mesma matemática em TODOS os substitutos deste alimento!
                if (scaledItem.substitutes && Array.isArray(scaledItem.substitutes)) {
                    scaledItem.substitutes = scaledItem.substitutes.map(sub => scaleObj(sub));
                }

                return scaledItem;
            });

            return { ...meal, items: updatedItems };
        });

        onApply(updatedMeals);
        onClose();
    };

    // Função dos botões de - e +
    const changePercentage = (amount) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        setPercentage(prev => {
            const current = parseInt(prev, 10) || 0;
            return String(Math.max(1, Math.min(100, current + amount)));
        });
    };

    // 🔥 Limpa o campo se digitar letras e trava no máximo em 100%
    const handleTextChange = (text) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        setPercentage(numericValue);
    };

    // 🔥 Se apagar tudo e sair do campo, volta pra 1 pra não quebrar a matemática
    const handleBlur = () => {
        const num = parseInt(percentage, 10);
        if (isNaN(num) || num < 1) {
            setPercentage('1');
        } else if (num > 100) {
            setPercentage('100');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <View style={[styles.iconBox, { backgroundColor: theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="tune" size={24} color={theme.accent} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>AJUSTE FINO (Tuning)</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary }]}>1. ONDE APLICAR?</Text>
                    <View style={styles.btnRow}>
                        <TouchableOpacity 
                            style={[styles.selectorBtn, scope === 'ALL' ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]} 
                            onPress={() => setScope('ALL')}
                        >
                            <Text style={[styles.selectorText, { color: scope === 'ALL' ? '#000' : theme.text }]}>Na Dieta Toda</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.btnRow, { flexWrap: 'wrap' }]}>
                        {visibleMeals.map((m, idx) => (
                            <TouchableOpacity 
                                key={m.id}
                                style={[styles.selectorBtn, scope === m.id ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]} 
                                onPress={() => setScope(m.id)}
                            >
                                <Text style={[styles.selectorText, { color: scope === m.id ? '#000' : theme.text }]}>Ref {idx + 1}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 15 }]}>2. QUAL MACRO AFETAR?</Text>
                    <View style={[styles.btnRow, { flexWrap: 'wrap' }]}>
                        {[
                            { id: 'ALL', label: 'Tudo (Calorias)' },
                            { id: 'CARB', label: 'Carboidratos' },
                            { id: 'PROT', label: 'Proteínas' },
                            { id: 'FAT', label: 'Gorduras' }
                        ].map(macro => (
                            <TouchableOpacity 
                                key={macro.id}
                                style={[styles.selectorBtn, targetMacro === macro.id ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]} 
                                onPress={() => setTargetMacro(macro.id)}
                            >
                                <Text style={[styles.selectorText, { color: targetMacro === macro.id ? '#000' : theme.text }]}>{macro.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 15 }]}>3. QUAL A PORCENTAGEM (%)?</Text>
                    <View style={styles.stepperContainer}>
                        <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => changePercentage(-5)}>
                            <MaterialCommunityIcons name="minus" size={24} color={theme.text} />
                        </TouchableOpacity>
                        
                        {/* 🔥 AGORA O NÚMERO É DIGITÁVEL E CONTINUA BONITO */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={[styles.percentageInput, { color: theme.text }]}
                                value={percentage}
                                onChangeText={handleTextChange}
                                onBlur={handleBlur}
                                keyboardType="number-pad"
                                maxLength={3}
                                selectTextOnFocus
                            />
                            <Text style={[styles.percentageSymbol, { color: theme.text }]}>%</Text>
                        </View>

                        <TouchableOpacity style={[styles.stepperBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => changePercentage(5)}>
                            <MaterialCommunityIcons name="plus" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.btnRow, { marginTop: 25 }]}>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#FF3B3015', borderColor: '#FF3B30' }]} 
                            onPress={() => handleApplyTuning(false)}
                        >
                            <MaterialCommunityIcons name="trending-down" size={20} color="#FF3B30" />
                            <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>REDUZIR -{percentage || '0'}%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionBtn, { backgroundColor: '#34C75915', borderColor: '#34C759' }]} 
                            onPress={() => handleApplyTuning(true)}
                        >
                            <MaterialCommunityIcons name="trending-up" size={20} color="#34C759" />
                            <Text style={[styles.actionBtnText, { color: '#34C759' }]}>AUMENTAR +{percentage || '0'}%</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Botão de Restaurar Cópia de Segurança */}
                    {canUndo && (
                        <TouchableOpacity 
                            style={[styles.undoBtn, { borderColor: theme.border }]}
                            onPress={() => {
                                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                onUndo();
                                onClose();
                            }}
                        >
                            <MaterialCommunityIcons name="undo-variant" size={20} color={theme.textSecondary} />
                            <Text style={[styles.undoBtnText, { color: theme.textSecondary }]}>DESFAZER AJUSTE FINO (RESTAURAR)</Text>
                        </TouchableOpacity>
                    )}

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: { width: '100%', maxWidth: 450, padding: 24, borderRadius: 24, borderWidth: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    btnRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    selectorBtn: { flex: 1, minWidth: '30%', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    selectorText: { fontSize: 12, fontWeight: 'bold' },
    stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginVertical: 10 },
    stepperBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    
    // 🔥 NOVOS ESTILOS DO CAMPO DE DIGITAÇÃO
    inputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 90 },
    percentageInput: { fontSize: 36, fontWeight: '900', textAlign: 'right', fontVariant: ['tabular-nums'], minWidth: 50, padding: 0, margin: 0 },
    percentageSymbol: { fontSize: 32, fontWeight: '900', marginLeft: 2, paddingBottom: 2 },
    
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, borderWidth: 1 },
    actionBtnText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
    undoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    undoBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, marginLeft: 8 },
});