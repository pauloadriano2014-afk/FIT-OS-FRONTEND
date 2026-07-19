// src/components/Admin/CoachOnboarding.js
// Modal de boas-vindas + checklist de primeiros passos para coaches parceiros
// Abre automaticamente na primeira vez. Checklist persiste no dashboard até completar.
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Modal,
    ScrollView, Animated, Platform, Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fitos-final.onrender.com';

const PLAN_LABELS = {
    PERSONAL:      { label: 'Personal Trainer', icon: 'dumbbell',   color: '#32ADE6' },
    NUTRICIONISTA: { label: 'Nutricionista',    icon: 'food-apple', color: '#34C759' },
    ELITE:         { label: 'Elite',            icon: 'trophy',     color: '#FFCC00' },
};

// ─── STEPS DO CHECKLIST ───────────────────────────────────────────────────────
// index = step number (1-based)
const STEPS = [
    {
        step:        1,
        icon:        'palette-swatch',
        color:       '#BF5AF2',
        title:       'Personalize sua marca',
        desc:        'Adicione sua logo para ela aparecer no app dos seus alunos.',
        tab:         'GESTAO',
        subtab:      'MARCA',
        cta:         'Ir para Minha Marca',
    },
    {
        step:        2,
        icon:        'storefront-outline',
        color:       '#FF9500',
        title:       'Configure sua página de vendas',
        desc:        'Crie sua vitrine online para captar novos alunos.',
        tab:         'GESTAO',
        subtab:      'SAAS',
        cta:         'Ir para Vendas',
    },
    {
        step:        3,
        icon:        'account-plus-outline',
        color:       '#32ADE6',
        title:       'Adicione seu primeiro aluno',
        desc:        'Compartilhe seu código de convite e cadastre seu primeiro aluno.',
        tab:         'ALUNOS',
        subtab:      null,
        cta:         'Ver meus alunos',
    },
    {
        step:        4,
        icon:        'dumbbell',
        color:       '#34C759',
        title:       'Monte o primeiro treino',
        desc:        'Entre no perfil do aluno e monte o treino personalizado dele.',
        tab:         'ALUNOS',
        subtab:      null,
        cta:         'Ver meus alunos',
    },
    {
        step:        5,
        icon:        'robot-outline',
        color:       '#FFCC00',
        title:       'Configure sua IA',
        desc:        'Personalize como a IA escreve as avaliações dos seus alunos.',
        tab:         'GESTAO',
        subtab:      'IA',
        cta:         'Ir para Minha IA',
    },
];

// ─── ITEM DO CHECKLIST ────────────────────────────────────────────────────────
function StepItem({ step, completedStep, onNavigate, theme }) {
    const done = step.step <= completedStep;
    return (
        <TouchableOpacity
            style={[
                styles.stepItem,
                {
                    backgroundColor: done ? step.color + '12' : theme.surface,
                    borderColor:     done ? step.color + '40' : theme.border,
                },
            ]}
            onPress={() => !done && onNavigate(step)}
            activeOpacity={done ? 1 : 0.7}
        >
            <View style={[styles.stepIcon, { backgroundColor: done ? step.color + '20' : theme.bg }]}>
                <MaterialCommunityIcons
                    name={done ? 'check-circle' : step.icon}
                    size={22}
                    color={done ? step.color : theme.textSecondary}
                />
            </View>
            <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={{
                    color:      done ? step.color : theme.text,
                    fontWeight: '900',
                    fontSize:   13,
                    textDecorationLine: done ? 'line-through' : 'none',
                }}>
                    {step.title}
                </Text>
                {!done && (
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2, lineHeight: 16 }}>
                        {step.desc}
                    </Text>
                )}
            </View>
            {!done && (
                <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
            )}
        </TouchableOpacity>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CoachOnboarding({ theme, navigation, setActiveTab, setSubTabGestao }) {
    const [coachId,           setCoachId]           = useState('');
    const [coachName,         setCoachName]          = useState('');
    const [coachPlan,         setCoachPlan]          = useState('PERSONAL');
    const [inviteCode,        setInviteCode]         = useState('');
    const [onboardingStep,    setOnboardingStep]     = useState(0);
    const [onboardingDone,    setOnboardingDone]     = useState(false);
    const [modalVisible,      setModalVisible]       = useState(false);
    const [checklistVisible,  setChecklistVisible]   = useState(false);
    const [saving,            setSaving]             = useState(false);

    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;

    // Carrega dados do coach do storage
    useEffect(() => {
        const load = async () => {
            try {
                const json = await AsyncStorage.getItem('user');
                if (!json) return;
                const u = JSON.parse(json);

                // Só roda para coaches parceiros
                if (u.role !== 'COACH') return;

                setCoachId(u.id ?? '');
                setCoachName(u.name?.split(' ')[0] ?? 'Coach');
                setCoachPlan(u.coachPlan ?? 'PERSONAL');
                setInviteCode(u.inviteCode ?? '');
                setOnboardingStep(u.onboardingStep ?? 0);

                const done = u.onboardingCompleted ?? false;
                setOnboardingDone(done);

                if (!done) {
                    // Primeira vez — abre o modal de boas-vindas
                    const seenKey = `@onboarding_seen_${u.id}`;
                    const seen    = await AsyncStorage.getItem(seenKey);
                    if (!seen) {
                        setTimeout(() => openModal(), 800);
                        await AsyncStorage.setItem(seenKey, '1');
                    } else {
                        // Já viu o modal — mostra só o checklist
                        setChecklistVisible(true);
                    }
                }
            } catch (e) { console.log('[CoachOnboarding]', e); }
        };
        load();
    }, []);

    const openModal = () => {
        setModalVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
        ]).start();
    };

    const closeModal = () => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            setModalVisible(false);
            setChecklistVisible(true);
        });
    };

    const markStep = async (step) => {
        if (step <= onboardingStep) return;
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coach-onboarding`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ coachId, step }),
            });
            const data = await res.json();
            if (data.ok) {
                setOnboardingStep(data.onboardingStep);
                if (data.onboardingCompleted) {
                    setOnboardingDone(true);
                    setChecklistVisible(false);
                    // Atualiza o cache local
                    const json = await AsyncStorage.getItem('user');
                    if (json) {
                        const u = JSON.parse(json);
                        await AsyncStorage.setItem('user', JSON.stringify({
                            ...u,
                            onboardingStep:      data.onboardingStep,
                            onboardingCompleted: true,
                        }));
                    }
                }
            }
        } catch (e) { console.log('[markStep]', e); }
        finally { setSaving(false); }
    };

    const dismiss = async () => {
        try {
            await fetch(`${BASE_URL}/api/admin/coach-onboarding`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ coachId, dismiss: true }),
            });
            setOnboardingDone(true);
            setChecklistVisible(false);
            setModalVisible(false);
            const json = await AsyncStorage.getItem('user');
            if (json) {
                const u = JSON.parse(json);
                await AsyncStorage.setItem('user', JSON.stringify({ ...u, onboardingCompleted: true }));
            }
        } catch (e) { console.log('[dismiss]', e); }
    };

    const handleNavigate = (step) => {
        // Navega para a aba correta e marca o step
        if (step.tab) setActiveTab(step.tab);
        if (step.subtab && setSubTabGestao) setSubTabGestao(step.subtab);
        markStep(step.step);
    };

    const copyInviteLink = () => {
        const link = `https://www.pauloadrianoteam.com.br/registro?coach=${inviteCode}`;
        if (Platform.OS === 'web') {
            navigator.clipboard?.writeText(link);
            window.alert('Link copiado!');
        } else {
            // React Native não tem clipboard nativo sem lib — abre para compartilhar
            Linking.openURL(`whatsapp://send?text=${encodeURIComponent(`Acesse a plataforma pelo meu link: ${link}`)}`);
        }
    };

    const planInfo = PLAN_LABELS[coachPlan] ?? PLAN_LABELS.PERSONAL;
    const progress = Math.round((onboardingStep / STEPS.length) * 100);

    // ── Não renderiza nada para masters nem coaches com onboarding concluído
    if (onboardingDone) return null;

    return (
        <>
            {/* ── MODAL DE BOAS-VINDAS ──────────────────────────────────── */}
            <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
                <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
                    <Animated.View style={[
                        styles.modalBox,
                        { backgroundColor: theme.bg, borderColor: theme.border },
                        { transform: [{ translateY: slideAnim }] },
                    ]}>
                        {/* Topo colorido */}
                        <View style={[styles.modalTop, { backgroundColor: planInfo.color + '18', borderBottomColor: planInfo.color + '30' }]}>
                            <View style={[styles.planBadge, { backgroundColor: planInfo.color + '25' }]}>
                                <MaterialCommunityIcons name={planInfo.icon} size={28} color={planInfo.color} />
                            </View>
                            <Text style={{ color: planInfo.color, fontWeight: '900', fontSize: 11, letterSpacing: 1, marginTop: 10 }}>
                                PLANO {planInfo.label.toUpperCase()}
                            </Text>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 22, marginTop: 4, textAlign: 'center' }}>
                                Bem-vindo, {coachName}! 🎉
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                                Seu acesso foi aprovado. Vamos configurar tudo para você começar a usar a plataforma.
                            </Text>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>

                            {/* Código de convite */}
                            {inviteCode ? (
                                <View style={[styles.inviteCard, { backgroundColor: theme.surface, borderColor: planInfo.color + '40' }]}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 }}>
                                        SEU CÓDIGO DE CONVITE
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Text style={{ color: planInfo.color, fontWeight: '900', fontSize: 22, letterSpacing: 3, flex: 1 }}>
                                            {inviteCode}
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.copyBtn, { backgroundColor: planInfo.color }]}
                                            onPress={copyInviteLink}
                                        >
                                            <MaterialCommunityIcons name="content-copy" size={16} color="#000" />
                                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#000' }}>COPIAR LINK</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 8, lineHeight: 16 }}>
                                        Compartilhe este link com seus alunos para que eles se cadastrem direto no seu painel.
                                    </Text>
                                </View>
                            ) : null}

                            {/* Próximos passos resumidos */}
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13 }}>
                                Seus próximos passos:
                            </Text>
                            {STEPS.map(s => (
                                <View key={s.step} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={[styles.stepDot, { backgroundColor: s.color + '20' }]}>
                                        <MaterialCommunityIcons name={s.icon} size={16} color={s.color} />
                                    </View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, flex: 1 }}>{s.title}</Text>
                                </View>
                            ))}

                            {/* Botão começar */}
                            <TouchableOpacity
                                style={[styles.startBtn, { backgroundColor: planInfo.color, marginTop: 6 }]}
                                onPress={closeModal}
                            >
                                <Text style={{ fontWeight: '900', fontSize: 15, color: '#000' }}>COMEÇAR AGORA →</Text>
                            </TouchableOpacity>

                            {/* Pular */}
                            <TouchableOpacity onPress={dismiss} style={{ alignItems: 'center', paddingVertical: 4 }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                                    Pular e configurar depois
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            </Modal>

            {/* ── CHECKLIST PERSISTENTE NO DASHBOARD ───────────────────── */}
            {checklistVisible && (
                <View style={[styles.checklist, { backgroundColor: theme.surface, borderColor: planInfo.color + '40' }]}>
                    {/* Header do checklist */}
                    <View style={styles.checklistHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13 }}>
                                🚀 Primeiros passos
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                {onboardingStep} de {STEPS.length} concluídos
                            </Text>
                        </View>
                        <TouchableOpacity onPress={dismiss} style={{ padding: 4 }}>
                            <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Barra de progresso */}
                    <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
                        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: planInfo.color }]} />
                    </View>

                    {/* Steps */}
                    <View style={{ gap: 8, marginTop: 12 }}>
                        {STEPS.map(s => (
                            <StepItem
                                key={s.step}
                                step={s}
                                completedStep={onboardingStep}
                                onNavigate={handleNavigate}
                                theme={theme}
                            />
                        ))}
                    </View>
                </View>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    // Modal
    modalBackdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalBox:       { width: '100%', maxWidth: 420, borderRadius: 24, borderWidth: 1, overflow: 'hidden', maxHeight: '90%' },
    modalTop:       { padding: 24, alignItems: 'center', borderBottomWidth: 1 },
    planBadge:      { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    inviteCard:     { borderRadius: 16, borderWidth: 1, padding: 14 },
    copyBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    stepDot:        { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    startBtn:       { padding: 16, borderRadius: 16, alignItems: 'center' },
    // Checklist
    checklist:      { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },
    checklistHeader:{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    progressBg:     { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill:   { height: 6, borderRadius: 3 },
    // Step item
    stepItem:       { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1 },
    stepIcon:       { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});