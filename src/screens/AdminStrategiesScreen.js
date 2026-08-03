// src/screens/AdminStrategiesScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, ActivityIndicator, Alert, Platform,
    useWindowDimensions, TextInput, Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const API_URL = 'https://fitos-final.onrender.com';

const STRATEGY_PRESETS = [
    { key: 'lowcarb',     icon: '🥩', label: 'Low Carb',       color: '#FF6B6B', desc: 'Redução de carboidratos para queima de gordura acelerada.' },
    { key: 'finalizacao', icon: '🏆', label: 'Finalização',     color: '#FFD700', desc: 'Protocolo de pico para competição ou evento especial.' },
    { key: 'cutting',     icon: '✂️', label: 'Cutting',         color: '#FF9500', desc: 'Déficit calórico agressivo com manutenção de massa muscular.' },
    { key: 'refeed',      icon: '⚡', label: 'Refeed',          color: '#00BFFF', desc: 'Recarga calórica estratégica para reiniciar o metabolismo.' },
    { key: 'manutencao',  icon: '⚖️', label: 'Manutenção',      color: '#00C851', desc: 'Período de manutenção entre fases de bulk e cutting.' },
    { key: 'custom',      icon: '✏️', label: 'Personalizada',   color: '#9B59B6', desc: 'Estratégia com nome e objetivo personalizados.' },
];

function fmtDate(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateShort(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function getStrategyStatus(strategy) {
    const now = new Date();
    if (!strategy.strategyActive) return { label: 'Inativa', color: '#555', icon: 'pause-circle-outline' };

    const start = strategy.strategyStartDate ? new Date(strategy.strategyStartDate) : null;
    const end   = strategy.strategyEndDate   ? new Date(strategy.strategyEndDate)   : null;

    if (start && now < start) return { label: 'Agendada',  color: '#00BFFF', icon: 'clock-outline' };
    if (end   && now > end)   return { label: 'Expirada',  color: '#FF6B6B', icon: 'calendar-remove' };
    return { label: 'Ativa', color: '#00C851', icon: 'check-circle-outline' };
}

// 🔥 Seletor reutilizável: aluno escolhe entre os dois planos, ou estratégia substitui totalmente
function ExclusiveModeToggle({ value, onChange, theme }) {
    return (
        <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.configCardHeader}>
                <MaterialCommunityIcons name="account-switch-outline" size={18} color={theme.accent} />
                <Text style={[styles.configCardTitle, { color: theme.text }]}>Como o aluno vê essa estratégia</Text>
            </View>
            <Text style={[styles.configCardDesc, { color: theme.textSecondary }]}>
                "Aluno escolhe" mostra as duas opções pra ele alternar. "Substitui totalmente" esconde a dieta base enquanto essa estratégia estiver ativa.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TouchableOpacity
                    style={[styles.toggleBtn, { borderColor: !value ? theme.accent : theme.border, backgroundColor: !value ? theme.accent + '20' : theme.surface }]}
                    onPress={() => onChange(false)}
                >
                    <Text style={[styles.toggleBtnText, { color: !value ? theme.accent : theme.textSecondary }]}>
                        🔀 Aluno escolhe
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, { borderColor: value ? theme.accent : theme.border, backgroundColor: value ? theme.accent + '20' : theme.surface }]}
                    onPress={() => onChange(true)}
                >
                    <Text style={[styles.toggleBtnText, { color: value ? theme.accent : theme.textSecondary }]}>
                        🔒 Substitui totalmente
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function CreateStrategyModal({ visible, onClose, onConfirm, baseDiet, theme }) {
    const [step,           setStep]           = useState(1);
    const [preset,         setPreset]         = useState(null);
    const [customName,     setCustomName]      = useState('');
    const [goal,           setGoal]           = useState('');
    const [waterIntake,    setWaterIntake]    = useState('');
    const [generalNotes,   setGeneralNotes]   = useState('');
    const [copyBase,       setCopyBase]       = useState(true);
    const [activateNow,    setActivateNow]    = useState(false);
    const [exclusiveMode,  setExclusiveMode]  = useState(false);
    const [useStartDate,   setUseStartDate]   = useState(false);
    const [useEndDate,     setUseEndDate]     = useState(false);
    const [startDate,      setStartDate]      = useState(new Date());
    const [endDate,        setEndDate]        = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d; });
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker,   setShowEndPicker]   = useState(false);
    const [loading,        setLoading]        = useState(false);

    function reset() {
        setStep(1); setPreset(null); setCustomName(''); setGoal('');
        setWaterIntake(''); setGeneralNotes(''); setCopyBase(true);
        setActivateNow(false); setExclusiveMode(false); setUseStartDate(false); setUseEndDate(false);
        setShowStartPicker(false); setShowEndPicker(false);
    }

    function handleClose() { reset(); onClose(); }

    async function handleConfirm() {
        const name = preset?.key === 'custom' ? customName.trim() : preset?.label;
        if (!name) return Alert.alert('Atenção', 'Informe o nome da estratégia.');
        setLoading(true);
        try {
            await onConfirm({
                strategyName:      name,
                goal:              goal || null,
                waterIntake:       waterIntake || null,
                generalNotes:      generalNotes || null,
                copyFromDietId:    copyBase && baseDiet ? baseDiet.id : null,
                activateNow,
                strategyExclusive: exclusiveMode,
                strategyStartDate: useStartDate ? startDate.toISOString() : null,
                strategyEndDate:   useEndDate   ? endDate.toISOString()   : null,
            });
            reset();
        } finally {
            setLoading(false);
        }
    }

    const selectedPreset = STRATEGY_PRESETS.find(p => p.key === preset?.key);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.modalSheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {step === 1 ? '⚡ Nova Estratégia' : `⚡ ${selectedPreset?.label ?? 'Estratégia'}`}
                            </Text>
                            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                                {step === 1 ? 'Escolha o tipo de estratégia' : 'Configure os detalhes'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        {step === 1 && (
                            <View style={{ gap: 8 }}>
                                {STRATEGY_PRESETS.map(p => (
                                    <TouchableOpacity
                                        key={p.key}
                                        style={[
                                            styles.presetCard,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            preset?.key === p.key && { borderColor: p.color, backgroundColor: p.color + '12' },
                                        ]}
                                        onPress={() => setPreset(p)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.presetIcon}>{p.icon}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.presetLabel, { color: preset?.key === p.key ? p.color : theme.text }]}>{p.label}</Text>
                                            <Text style={[styles.presetDesc,  { color: theme.textSecondary }]}>{p.desc}</Text>
                                        </View>
                                        {preset?.key === p.key && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color={p.color} />
                                        )}
                                    </TouchableOpacity>
                                ))}

                                {preset?.key === 'custom' && (
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                        placeholder="Nome da estratégia personalizada..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={customName}
                                        onChangeText={setCustomName}
                                    />
                                )}

                                <TouchableOpacity
                                    style={[styles.btnPrimary, { backgroundColor: theme.accent, opacity: preset ? 1 : 0.4 }]}
                                    onPress={() => preset && setStep(2)}
                                    disabled={!preset}
                                >
                                    <Text style={styles.btnPrimaryText}>Continuar →</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {step === 2 && (
                            <View style={{ gap: 14 }}>
                                {baseDiet && (
                                    <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.configCardHeader}>
                                            <MaterialCommunityIcons name="content-copy" size={18} color={theme.accent} />
                                            <Text style={[styles.configCardTitle, { color: theme.text }]}>Ponto de partida</Text>
                                        </View>
                                        <Text style={[styles.configCardDesc, { color: theme.textSecondary }]}>
                                            Copiar as refeições da dieta base para editar depois na Mesa de Operações?
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                                            {[true, false].map(v => (
                                                <TouchableOpacity
                                                    key={String(v)}
                                                    style={[styles.toggleBtn, { borderColor: copyBase === v ? theme.accent : theme.border, backgroundColor: copyBase === v ? theme.accent + '20' : theme.surface }]}
                                                    onPress={() => setCopyBase(v)}
                                                >
                                                    <Text style={[styles.toggleBtnText, { color: copyBase === v ? theme.accent : theme.textSecondary }]}>
                                                        {v ? '✅ Copiar dieta base' : '📄 Começar do zero'}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <Text style={[styles.configCardTitle, { color: theme.text }]}>Objetivo (opcional)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text, marginTop: 8 }]}
                                        placeholder="Ex: Reduzir 2kg em 2 semanas, Definição para evento..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={goal}
                                        onChangeText={setGoal}
                                    />
                                </View>

                                {/* 🔥 Aluno escolhe vs substitui totalmente */}
                                <ExclusiveModeToggle value={exclusiveMode} onChange={setExclusiveMode} theme={theme} />

                                <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={styles.configCardHeader}>
                                        <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.accent} />
                                        <Text style={[styles.configCardTitle, { color: theme.text }]}>Período de vigência</Text>
                                    </View>
                                    <Text style={[styles.configCardDesc, { color: theme.textSecondary }]}>
                                        Deixe em branco para controle manual (você ativa e desativa quando quiser).
                                    </Text>

                                    <TouchableOpacity
                                        style={[styles.dateRow, { borderColor: useStartDate ? theme.accent : theme.border, backgroundColor: useStartDate ? theme.accent + '10' : theme.bg }]}
                                        onPress={() => { setUseStartDate(v => !v); }}
                                    >
                                        <MaterialCommunityIcons name={useStartDate ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={useStartDate ? theme.accent : theme.textSecondary} />
                                        <Text style={[styles.dateLabel, { color: useStartDate ? theme.text : theme.textSecondary }]}>
                                            Início: {useStartDate ? startDate.toLocaleDateString('pt-BR') : 'manual'}
                                        </Text>
                                        {useStartDate && (
                                            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.dateEditBtn, { backgroundColor: theme.accent + '20' }]}>
                                                <MaterialCommunityIcons name="pencil" size={14} color={theme.accent} />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.dateRow, { borderColor: useEndDate ? theme.accent : theme.border, backgroundColor: useEndDate ? theme.accent + '10' : theme.bg, marginTop: 8 }]}
                                        onPress={() => setUseEndDate(v => !v)}
                                    >
                                        <MaterialCommunityIcons name={useEndDate ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={useEndDate ? theme.accent : theme.textSecondary} />
                                        <Text style={[styles.dateLabel, { color: useEndDate ? theme.text : theme.textSecondary }]}>
                                            Fim: {useEndDate ? endDate.toLocaleDateString('pt-BR') : 'sem data de fim'}
                                        </Text>
                                        {useEndDate && (
                                            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.dateEditBtn, { backgroundColor: theme.accent + '20' }]}>
                                                <MaterialCommunityIcons name="pencil" size={14} color={theme.accent} />
                                            </TouchableOpacity>
                                        )}
                                    </TouchableOpacity>

                                    {showStartPicker && (
                                        <DateTimePicker
                                            value={startDate}
                                            mode="date"
                                            display="default"
                                            onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }}
                                        />
                                    )}
                                    {showEndPicker && (
                                        <DateTimePicker
                                            value={endDate}
                                            mode="date"
                                            display="default"
                                            onChange={(_, d) => { setShowEndPicker(false); if (d) setEndDate(d); }}
                                        />
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.toggleFullBtn, { borderColor: activateNow ? '#00C851' : theme.border, backgroundColor: activateNow ? '#00C85115' : theme.surface }]}
                                    onPress={() => setActivateNow(v => !v)}
                                >
                                    <MaterialCommunityIcons name={activateNow ? 'lightning-bolt' : 'lightning-bolt-outline'} size={20} color={activateNow ? '#00C851' : theme.textSecondary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.toggleFullLabel, { color: activateNow ? '#00C851' : theme.text }]}>
                                            {activateNow ? 'Ativar imediatamente' : 'Salvar sem ativar'}
                                        </Text>
                                        <Text style={[styles.toggleFullDesc, { color: theme.textSecondary }]}>
                                            {activateNow ? 'O aluno já verá esta estratégia ao abrir o app.' : 'Você poderá ativar quando quiser na lista de estratégias.'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TouchableOpacity style={[styles.btnSecondary, { borderColor: theme.border, flex: 1 }]} onPress={() => setStep(1)}>
                                        <Text style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>← Voltar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.btnPrimary, { flex: 2, backgroundColor: theme.accent }]} onPress={handleConfirm} disabled={loading}>
                                        {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.btnPrimaryText}>{activateNow ? '⚡ Criar e Ativar' : '✅ Criar Estratégia'}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// ── Card de estratégia ────────────────────────────────────────────────────────
function StrategyCard({ strategy, baseDietId, onActivate, onDeactivate, onDelete, onEditDates, onEditMeals, theme }) {
    const status = getStrategyStatus(strategy);
    const preset = STRATEGY_PRESETS.find(p => p.label === strategy.strategyName) ?? STRATEGY_PRESETS.find(p => p.key === 'custom');
    const color  = preset?.color ?? '#00C851';

    return (
        <View style={[styles.stratCard, { backgroundColor: theme.surface, borderColor: status.label === 'Ativa' ? color : theme.border }]}>
            <View style={[styles.stratStatusBar, { backgroundColor: status.color + '20' }]}>
                <MaterialCommunityIcons name={status.icon} size={14} color={status.color} />
                <Text style={[styles.stratStatusText, { color: status.color }]}>{status.label}</Text>
                {strategy.strategyStartDate && (
                    <Text style={[styles.stratDates, { color: theme.textSecondary }]}>
                        {fmtDateShort(strategy.strategyStartDate)} → {strategy.strategyEndDate ? fmtDateShort(strategy.strategyEndDate) : '∞'}
                    </Text>
                )}
            </View>

            <View style={styles.stratBody}>
                <View style={styles.stratTitleRow}>
                    <View style={[styles.stratIconBox, { backgroundColor: color + '20' }]}>
                        <Text style={{ fontSize: 18 }}>{preset?.icon ?? '⚡'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.stratName, { color: theme.text }]}>{strategy.strategyName}</Text>
                        {strategy.goal && (
                            <Text style={[styles.stratGoal, { color: theme.textSecondary }]} numberOfLines={1}>{strategy.goal}</Text>
                        )}
                    </View>
                </View>

                <View style={styles.stratInfo}>
                    <View style={[styles.stratInfoPill, { backgroundColor: theme.bg }]}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={12} color={theme.textSecondary} />
                        <Text style={[styles.stratInfoText, { color: theme.textSecondary }]}>
                            {strategy.meals?.length ?? 0} refeições
                        </Text>
                    </View>
                    {strategy.strategyEndDate && (
                        <View style={[styles.stratInfoPill, { backgroundColor: theme.bg }]}>
                            <MaterialCommunityIcons name="calendar-end" size={12} color={theme.textSecondary} />
                            <Text style={[styles.stratInfoText, { color: theme.textSecondary }]}>
                                até {fmtDate(strategy.strategyEndDate)}
                            </Text>
                        </View>
                    )}
                    {!strategy.strategyStartDate && !strategy.strategyEndDate && (
                        <View style={[styles.stratInfoPill, { backgroundColor: theme.bg }]}>
                            <MaterialCommunityIcons name="hand-pointing-right" size={12} color={theme.textSecondary} />
                            <Text style={[styles.stratInfoText, { color: theme.textSecondary }]}>controle manual</Text>
                        </View>
                    )}
                    {/* 🔥 Indica o modo de exibição pro aluno, só quando ativa */}
                    {status.label === 'Ativa' && (
                        <View style={[styles.stratInfoPill, { backgroundColor: theme.bg }]}>
                            <MaterialCommunityIcons name={strategy.strategyExclusive ? 'lock-outline' : 'shuffle-variant'} size={12} color={theme.textSecondary} />
                            <Text style={[styles.stratInfoText, { color: theme.textSecondary }]}>
                                {strategy.strategyExclusive ? 'substitui a dieta base' : 'aluno escolhe entre esta e a base'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── AÇÕES DO CARD ── */}
                <View style={styles.stratActions}>
                    {status.label !== 'Ativa' ? (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00C85120', borderColor: '#00C85150' }]} onPress={onActivate}>
                            <MaterialCommunityIcons name="lightning-bolt" size={16} color="#00C851" />
                            <Text style={[styles.actionBtnText, { color: '#00C851' }]}>Ativar</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF6B6B20', borderColor: '#FF6B6B50' }]} onPress={onDeactivate}>
                            <MaterialCommunityIcons name="pause" size={16} color="#FF6B6B" />
                            <Text style={[styles.actionBtnText, { color: '#FF6B6B' }]}>Pausar</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]} onPress={onEditMeals}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={theme.accent} />
                        <Text style={[styles.actionBtnText, { color: theme.accent }]}>Dieta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={onEditDates}>
                        <MaterialCommunityIcons name="calendar-edit" size={16} color={theme.textSecondary} />
                        <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>Datas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3030' }]} onPress={onDelete}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                        <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Excluir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

// 🔥 Agora edita também o modo (aluno escolhe / substitui totalmente), não só datas
function EditStrategyModal({ visible, strategy, onClose, onSave, theme }) {
    const [startDate,       setStartDate]       = useState(null);
    const [endDate,         setEndDate]         = useState(null);
    const [useStart,        setUseStart]        = useState(false);
    const [useEnd,          setUseEnd]          = useState(false);
    const [exclusiveMode,   setExclusiveMode]   = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker,   setShowEndPicker]   = useState(false);
    const [loading,         setLoading]         = useState(false);

    useEffect(() => {
        if (strategy) {
            const s = strategy.strategyStartDate ? new Date(strategy.strategyStartDate) : new Date();
            const e = strategy.strategyEndDate   ? new Date(strategy.strategyEndDate)   : new Date(Date.now() + 14 * 86400000);
            setStartDate(s);
            setEndDate(e);
            setUseStart(!!strategy.strategyStartDate);
            setUseEnd(!!strategy.strategyEndDate);
            setExclusiveMode(!!strategy.strategyExclusive);
        }
    }, [strategy]);

    async function handleSave() {
        setLoading(true);
        try {
            await onSave({
                strategyStartDate: useStart ? startDate?.toISOString() : null,
                strategyEndDate:   useEnd   ? endDate?.toISOString()   : null,
                strategyExclusive: exclusiveMode,
            });
        } finally {
            setLoading(false);
        }
    }

    if (!strategy) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.editModal, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text, marginBottom: 4 }]}>Editar estratégia</Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textSecondary, marginBottom: 16 }]}>{strategy.strategyName}</Text>

                    <TouchableOpacity
                        style={[styles.dateRow, { borderColor: useStart ? theme.accent : theme.border, backgroundColor: useStart ? theme.accent + '10' : theme.surface, marginBottom: 8 }]}
                        onPress={() => setUseStart(v => !v)}
                    >
                        <MaterialCommunityIcons name={useStart ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={useStart ? theme.accent : theme.textSecondary} />
                        <Text style={[styles.dateLabel, { color: useStart ? theme.text : theme.textSecondary }]}>
                            Início: {useStart && startDate ? startDate.toLocaleDateString('pt-BR') : 'manual'}
                        </Text>
                        {useStart && <TouchableOpacity onPress={() => setShowStartPicker(true)} style={[styles.dateEditBtn, { backgroundColor: theme.accent + '20' }]}><MaterialCommunityIcons name="pencil" size={14} color={theme.accent} /></TouchableOpacity>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dateRow, { borderColor: useEnd ? theme.accent : theme.border, backgroundColor: useEnd ? theme.accent + '10' : theme.surface, marginBottom: 16 }]}
                        onPress={() => setUseEnd(v => !v)}
                    >
                        <MaterialCommunityIcons name={useEnd ? 'checkbox-marked' : 'checkbox-blank-outline'} size={20} color={useEnd ? theme.accent : theme.textSecondary} />
                        <Text style={[styles.dateLabel, { color: useEnd ? theme.text : theme.textSecondary }]}>
                            Fim: {useEnd && endDate ? endDate.toLocaleDateString('pt-BR') : 'sem data de fim'}
                        </Text>
                        {useEnd && <TouchableOpacity onPress={() => setShowEndPicker(true)} style={[styles.dateEditBtn, { backgroundColor: theme.accent + '20' }]}><MaterialCommunityIcons name="pencil" size={14} color={theme.accent} /></TouchableOpacity>}
                    </TouchableOpacity>

                    {showStartPicker && <DateTimePicker value={startDate ?? new Date()} mode="date" display="default" onChange={(_, d) => { setShowStartPicker(false); if (d) setStartDate(d); }} />}
                    {showEndPicker   && <DateTimePicker value={endDate   ?? new Date()} mode="date" display="default" onChange={(_, d) => { setShowEndPicker(false);   if (d) setEndDate(d);   }} />}

                    <View style={{ marginBottom: 16 }}>
                        <ExclusiveModeToggle value={exclusiveMode} onChange={setExclusiveMode} theme={theme} />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.btnSecondary, { borderColor: theme.border, flex: 1 }]} onPress={onClose}>
                            <Text style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnPrimary, { flex: 2, backgroundColor: theme.accent }]} onPress={handleSave} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.btnPrimaryText}>Salvar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function AdminStrategiesScreen({ route, navigation }) {
    const { theme } = useTheme();
    const { width: windowWidth } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const rawAluno = route.params?.aluno;
    const aluno    = (typeof rawAluno === 'string' && rawAluno.startsWith('{')) ? JSON.parse(rawAluno) : rawAluno;
    const userId   = (aluno?.id && aluno.id !== '[object Object]') ? aluno.id : route.params?.alunoId;

    const [loading,        setLoading]        = useState(true);
    const [strategies,     setStrategies]     = useState([]);
    const [baseDiet,       setBaseDiet]       = useState(null);
    const [createVisible,  setCreateVisible]  = useState(false);
    const [editTarget,     setEditTarget]     = useState(null);
    const [editVisible,    setEditVisible]    = useState(false);

    const load = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res  = await fetch(`${API_URL}/api/admin/strategies/${userId}`);
            const data = await res.json();
            setBaseDiet(data.baseDiets?.[0] ?? null);
            setStrategies(data.strategies ?? []);
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível carregar as estratégias.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    async function handleCreate(payload) {
        const res = await fetch(`${API_URL}/api/admin/strategies/${userId}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao criar');
        setCreateVisible(false);
        await load();
    }

    async function handleActivate(strategyId) {
        try {
            await fetch(`${API_URL}/api/admin/strategies/${userId}/${strategyId}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ action: 'activate' }),
            });
            await load();
        } catch { Alert.alert('Erro', 'Falha ao ativar estratégia.'); }
    }

    async function handleDeactivate(strategyId) {
        try {
            await fetch(`${API_URL}/api/admin/strategies/${userId}/${strategyId}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ action: 'deactivate' }),
            });
            await load();
        } catch { Alert.alert('Erro', 'Falha ao desativar estratégia.'); }
    }

    async function handleDelete(strategyId) {
        Alert.alert(
            'Excluir estratégia',
            'Esta ação é permanente. A dieta base do aluno não será afetada.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir', style: 'destructive',
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/api/admin/strategies/${userId}/${strategyId}`, { method: 'DELETE' });
                            await load();
                        } catch { Alert.alert('Erro', 'Falha ao excluir.'); }
                    },
                },
            ]
        );
    }

    async function handleEditSave(payload) {
        if (!editTarget) return;
        try {
            await fetch(`${API_URL}/api/admin/strategies/${userId}/${editTarget.id}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ action: 'update', ...payload }),
            });
            setEditVisible(false);
            setEditTarget(null);
            await load();
        } catch { Alert.alert('Erro', 'Falha ao salvar alterações.'); }
    }

    const activeStrategy = strategies.find(s => getStrategyStatus(s).label === 'Ativa');
    // 🔥 Base só fica "escondida" quando a estratégia ativa é exclusiva
    const baseIsHidden = !!(activeStrategy && activeStrategy.strategyExclusive);

    return (
        <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]}>
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>ESTRATÉGIAS</Text>
                    <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{aluno?.name}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => setCreateVisible(true)}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.baseDietCard, { backgroundColor: theme.surface, borderColor: baseIsHidden ? theme.border : theme.accent }]}>
                        <View style={styles.baseDietHeader}>
                            <View style={[styles.baseDietIconBox, { backgroundColor: baseIsHidden ? theme.border + '30' : theme.accent + '20' }]}>
                                <MaterialCommunityIcons name="food-apple" size={20} color={baseIsHidden ? theme.textSecondary : theme.accent} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.baseDietTitle, { color: baseIsHidden ? theme.textSecondary : theme.text }]}>
                                    Dieta Base
                                </Text>
                                <Text style={[styles.baseDietSub, { color: theme.textSecondary }]}>
                                    {activeStrategy
                                        ? (baseIsHidden
                                            ? `Oculta — estratégia "${activeStrategy.strategyName}" está substituindo totalmente`
                                            : `Aluno escolhe entre esta e "${activeStrategy.strategyName}"`)
                                        : 'Único plano disponível para o aluno'}
                                </Text>
                            </View>
                            <View style={[styles.baseDietStatus, { backgroundColor: baseIsHidden ? '#55555520' : theme.accent + '20' }]}>
                                <MaterialCommunityIcons name={baseIsHidden ? 'eye-off' : 'eye'} size={14} color={baseIsHidden ? '#555' : theme.accent} />
                                <Text style={[styles.baseDietStatusText, { color: baseIsHidden ? '#555' : theme.accent }]}>
                                    {baseIsHidden ? 'Oculta' : 'Visível'}
                                </Text>
                            </View>
                        </View>
                        {baseDiet && (
                            <View style={styles.baseDietInfo}>
                                <Text style={[styles.baseDietInfoText, { color: theme.textSecondary }]}>
                                    {baseDiet.meals?.length ?? 0} refeições · {Math.round(baseDiet.totalKcal ?? 0)} kcal
                                </Text>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('AdminDietScreen', { aluno, alunoId: userId })}
                                    style={[styles.baseDietEditBtn, { borderColor: theme.border }]}
                                >
                                    <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textSecondary} />
                                    <Text style={[styles.baseDietEditText, { color: theme.textSecondary }]}>Mesa de Operações</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.sectionHeader}>
                        <View style={[styles.sectionStrip, { backgroundColor: theme.accent }]} />
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                            ESTRATÉGIAS ({strategies.length})
                        </Text>
                    </View>

                    {strategies.length === 0 ? (
                        <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="lightning-bolt-outline" size={40} color={theme.textSecondary} />
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nenhuma estratégia criada</Text>
                            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                                Crie uma estratégia temporária — o aluno pode escolher entre ela e a dieta base, ou ela pode substituir totalmente, dependendo do que você configurar.
                            </Text>
                            <TouchableOpacity
                                style={[styles.btnPrimary, { backgroundColor: theme.accent, marginTop: 16, paddingHorizontal: 24 }]}
                                onPress={() => setCreateVisible(true)}
                            >
                                <Text style={styles.btnPrimaryText}>+ Criar primeira estratégia</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        strategies
                            .sort((a, b) => {
                                const order = { 'Ativa': 0, 'Agendada': 1, 'Expirada': 2, 'Inativa': 3 };
                                return (order[getStrategyStatus(a).label] ?? 4) - (order[getStrategyStatus(b).label] ?? 4);
                            })
                            .map(strategy => (
                                <StrategyCard
                                    key={strategy.id}
                                    strategy={strategy}
                                    baseDietId={baseDiet?.id}
                                    theme={theme}
                                    onActivate={() => handleActivate(strategy.id)}
                                    onDeactivate={() => handleDeactivate(strategy.id)}
                                    onDelete={() => handleDelete(strategy.id)}
                                    onEditDates={() => { setEditTarget(strategy); setEditVisible(true); }}
                                    onEditMeals={() => navigation.navigate('AdminDietScreen', {
                                        aluno,
                                        alunoId: userId,
                                        strategyId: strategy.id,
                                        strategyName: strategy.strategyName
                                    })}
                                />
                            ))
                    )}
                </ScrollView>
            )}

            <CreateStrategyModal
                visible={createVisible}
                onClose={() => setCreateVisible(false)}
                onConfirm={handleCreate}
                baseDiet={baseDiet}
                theme={theme}
            />

            <EditStrategyModal
                visible={editVisible}
                strategy={editTarget}
                onClose={() => { setEditVisible(false); setEditTarget(null); }}
                onSave={handleEditSave}
                theme={theme}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root:               { flex: 1 },
    header:             { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, elevation: 5, zIndex: 10 },
    iconBtn:            { padding: 9, borderRadius: 14, borderWidth: 1 },
    headerTitle:        { fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
    headerSub:          { fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    content:            { padding: 16, paddingBottom: 60 },
    baseDietCard:       { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 20 },
    baseDietHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
    baseDietIconBox:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    baseDietTitle:      { fontSize: 14, fontWeight: '800' },
    baseDietSub:        { fontSize: 10, marginTop: 2 },
    baseDietStatus:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    baseDietStatusText: { fontSize: 10, fontWeight: '700' },
    baseDietInfo:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ffffff10' },
    baseDietInfoText:   { fontSize: 11 },
    baseDietEditBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
    baseDietEditText:   { fontSize: 11, fontWeight: '600' },
    sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionStrip:       { width: 4, height: 14, borderRadius: 2 },
    sectionTitle:       { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    stratCard:          { borderRadius: 16, borderWidth: 1.5, marginBottom: 12, overflow: 'hidden' },
    stratStatusBar:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
    stratStatusText:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    stratDates:         { fontSize: 10 },
    stratBody:          { padding: 12 },
    stratTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    stratIconBox:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stratName:          { fontSize: 14, fontWeight: '800' },
    stratGoal:          { fontSize: 10, marginTop: 2 },
    stratInfo:          { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
    stratInfoPill:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    stratInfoText:      { fontSize: 10, fontWeight: '600' },
    stratActions:       { flexDirection: 'row', gap: 8 },
    actionBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, borderRadius: 10, borderWidth: 1 },
    actionBtnText:      { fontSize: 11, fontWeight: '700' },
    emptyBox:           { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 20 },
    emptyTitle:         { fontSize: 16, fontWeight: '900', marginTop: 12 },
    emptyDesc:          { fontSize: 12, marginTop: 8, textAlign: 'center', lineHeight: 18 },
    modalBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet:         { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, padding: 20, paddingBottom: 36, maxHeight: '92%' },
    handleBar:          { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalHeader:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
    modalTitle:         { fontSize: 17, fontWeight: '900' },
    modalSubtitle:      { fontSize: 11, marginTop: 3 },
    closeBtn:           { padding: 7, borderRadius: 10, borderWidth: 1 },
    presetCard:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5 },
    presetIcon:         { fontSize: 22, width: 32, textAlign: 'center' },
    presetLabel:        { fontSize: 13, fontWeight: '800' },
    presetDesc:         { fontSize: 11, marginTop: 2 },
    configCard:         { borderRadius: 14, borderWidth: 1, padding: 14 },
    configCardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    configCardTitle:    { fontSize: 13, fontWeight: '800' },
    configCardDesc:     { fontSize: 11, lineHeight: 16 },
    toggleBtn:          { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    toggleBtnText:      { fontSize: 11, fontWeight: '700' },
    toggleFullBtn:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
    toggleFullLabel:    { fontSize: 13, fontWeight: '800' },
    toggleFullDesc:     { fontSize: 10, marginTop: 2 },
    dateRow:            { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
    dateLabel:          { flex: 1, fontSize: 12, fontWeight: '600' },
    dateEditBtn:        { padding: 6, borderRadius: 8 },
    editModal:          { margin: 20, borderRadius: 20, borderWidth: 1, padding: 20 },
    input:              { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13 },
    btnPrimary:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 14, borderRadius: 14 },
    btnPrimaryText:     { fontSize: 14, fontWeight: '900', color: '#000' },
    btnSecondary:       { padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    btnSecondaryText:   { fontSize: 13, fontWeight: '700' },
});