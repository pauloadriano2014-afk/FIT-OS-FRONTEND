// src/screens/DietScreen.js — VERSÃO 3.1
// 🔥 Aluno escolhe entre a dieta base e a estratégia ativa — a menos que a estratégia
// esteja marcada como strategyExclusive (aí ela substitui totalmente, como era antes)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Linking,
    Animated, useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

// ─── COMPONENTES ─────────────────────────────────────────────────────────────
import WaterTracker      from '../components/ClientDiet/WaterTracker';
import ShoppingListModal from '../components/ClientDiet/ShoppingListModal';
import DayTypeSelector   from '../components/ClientDiet/DayTypeSelector';
import DietProgressBar   from '../components/ClientDiet/DietProgressBar';
import DietHeader        from '../components/ClientDiet/DietHeader';
import CleanMealCard     from '../components/ClientDiet/CleanMealCard';
import FreeMealGuide     from '../components/ClientDiet/FreeMealGuide';
import DietSurveyModal   from '../components/ClientDiet/DietSurveyModal';
import DietMindsetPanel  from '../components/ClientDiet/DietMindsetPanel';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const DAY_ORDER = ['TREINO', 'TREINO_CARDIO', 'CARDIO', 'DESCANSO'];

const getGoalType = (userData) => {
    if (!userData) return 'HIPERTROFIA';
    const g = String(userData.goal ?? userData.anamneses?.[0]?.objetivo ?? '').toLowerCase();
    return (g.includes('emagreci') || g.includes('seca') || g.includes('defini') || g.includes('perda'))
        ? 'EMAGRECIMENTO' : 'HIPERTROFIA';
};

// ─── TELA DE ESTADO GENÉRICA ──────────────────────────────────────────────────
function StateScreen({ theme, icon, iconColor, title, desc, children, RootComponent }) {
    return (
        <RootComponent style={[styles.centered, { backgroundColor: theme.bg }]}>
            <MaterialCommunityIcons
                name={icon} size={60}
                color={iconColor ?? theme.accent}
                style={{ marginBottom: 20 }}
            />
            <Text style={[styles.stateTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>{desc}</Text>
            {children}
        </RootComponent>
    );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function DietScreen({ route }) {
    const { theme }  = useTheme();
    const isWeb      = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    // Os dois planos guardados separadamente, mais qual deles está selecionado pra visualização
    const [baseDiet,        setBaseDiet]        = useState(null);
    const [strategyDiet,    setStrategyDiet]     = useState(null);
    const [selectedSource,  setSelectedSource]   = useState('strategy'); // 'strategy' | 'base'

    const [loading,         setLoading]         = useState(true);
    const [user,            setUser]            = useState(null);
    const [accessDenied,    setAccessDenied]    = useState(false);
    const [isFinanceLocked, setIsFinanceLocked] = useState(false);

    const [activeTab,     setActiveTab]     = useState('DIETA');
    const [activeDayType, setActiveDayType] = useState('TREINO');

    const [checkedMeals,    setCheckedMeals]    = useState({});
    const [surveyVisible,   setSurveyVisible]   = useState(false);
    const [shoppingOpen,    setShoppingOpen]    = useState(false);
    const [checkedShopping, setCheckedShopping] = useState([]);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Plano efetivamente exibido — deriva de qual fonte está selecionada
    const diet = useMemo(() => {
        if (selectedSource === 'strategy' && strategyDiet) return strategyDiet;
        return baseDiet;
    }, [selectedSource, strategyDiet, baseDiet]);

    // 🔥 Só oferece escolha se a estratégia existir E não for exclusiva
    const hasChoice = !!(baseDiet && strategyDiet && !strategyDiet.strategyExclusive);

    // ── INICIALIZAÇÃO ─────────────────────────────────────────────────────────
    useEffect(() => {
        const initialize = async () => {
            try {
                let u = route.params?.aluno ?? route.params?.userData ?? route.params?.user ?? route.params?.student;
                if (typeof u === 'string') u = JSON.parse(u);
                if (!u && route.params?.id) u = route.params;
                if (!u?.id) {
                    const stored = await AsyncStorage.getItem('user');
                    if (stored) u = JSON.parse(stored);
                }
                if (!u?.id) { setLoading(false); return; }
                setUser(u);

                const isElite = u.plan === 'ELITE' || u.plan === 'VIP';
                if (!u.dietModule && !isElite) { setAccessDenied(true); setLoading(false); return; }

                if (u.paymentDueDate && u.isFinanceActive !== false) {
                    const due   = new Date(u.paymentDueDate); due.setHours(0,0,0,0);
                    const today = new Date();                 today.setHours(0,0,0,0);
                    if (Math.ceil((due.getTime() - today.getTime()) / 86400000) <= 0) {
                        setIsFinanceLocked(true); setLoading(false); return;
                    }
                }

                fetchDiet(u.id);
            } catch { setLoading(false); }
        };
        initialize();
    }, [route.params]);

    // 🔥 BUSCA INTELIGENTE — guarda BASE e ESTRATÉGIA separadamente
    const fetchDiet = async (userId) => {
        // 🔒 As duas rotas abaixo (admin/strategies e diet) passaram a exigir
        // login verificado (JWT) e essa tela nunca tinha sido atualizada pra
        // mandar o token — por isso a dieta sumia mesmo deslogando e logando
        // de novo (o token novo existia, mas a tela nunca chegava a usá-lo).
        const authHdrs = await authHeaders();
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/strategies/${userId}?t=${Date.now()}`, { headers: { ...authHdrs } });
            if (res.ok) {
                const data = await res.json();
                const strategies = data.strategies || [];
                const baseDiets  = data.baseDiets  || [];

                // Validação rigorosa de tempo e status
                const now = new Date();
                const activeStrategy = strategies.find(s => {
                    if (!s.strategyActive) return false;
                    const start = s.strategyStartDate ? new Date(s.strategyStartDate) : null;
                    const end   = s.strategyEndDate   ? new Date(s.strategyEndDate)   : null;
                    if (start && now < start) return false;
                    if (end && now > end) return false;
                    return true;
                });

                const base  = (baseDiets.length > 0 && baseDiets[0].meals?.length > 0) ? baseDiets[0] : null;
                const strat = (activeStrategy && activeStrategy.meals?.length > 0) ? { ...activeStrategy, isStrategy: true } : null;

                if (base || strat) {
                    setBaseDiet(base);
                    setStrategyDiet(strat);
                    // Abre na estratégia se ela existir (comportamento anterior), senão na base
                    setSelectedSource(strat ? 'strategy' : 'base');
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                    setLoading(false);
                    return; // Sucesso com a inteligência nova, não precisa do fallback
                }
            }
        } catch (e) {
            console.log('Falha na rota inteligente, ativando fallback normal...', e);
        }

        // Fallback blindado caso a rota de estratégias falhe (para não quebrar o app do aluno)
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/diet/${userId}?t=${Date.now()}`, { headers: { ...authHdrs } });
            if (res.ok) {
                const data = await res.json();
                if (data?.meals?.length > 0) {
                    setBaseDiet(data);
                    setStrategyDiet(null);
                    setSelectedSource('base');
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                } else { setBaseDiet(null); setStrategyDiet(null); }
            } else { setBaseDiet(null); setStrategyDiet(null); }
        } catch { setBaseDiet(null); setStrategyDiet(null); }
        finally  { setLoading(false); }
    };

    // ── DADOS DERIVADOS ───────────────────────────────────────────────────────
    const goalType = useMemo(() => getGoalType(user), [user]);

    const availableTypes = useMemo(() => {
        if (!diet?.meals) return ['TREINO'];
        const present = new Set(diet.meals.map(m => m.dayType ?? 'TREINO'));
        return DAY_ORDER.filter(t => present.has(t));
    }, [diet]);

    // Garante que activeDayType está sempre num tipo disponível
    useEffect(() => {
        if (availableTypes.length > 0 && !availableTypes.includes(activeDayType)) {
            setActiveDayType(availableTypes[0]);
        }
    }, [availableTypes]);

    const visibleMeals = useMemo(() => {
        if (!diet?.meals) return [];
        return diet.meals
            .filter(m => (m.dayType ?? 'TREINO') === activeDayType)
            .sort((a, b) => {
                // Ordena por horário
                const toMin = (t) => {
                    if (!t?.includes(':')) return 0;
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };
                return toMin(a.time) - toMin(b.time);
            });
    }, [diet, activeDayType]);

    const toggleMealCheck    = (id)   => setCheckedMeals(p => ({ ...p, [id]: !p[id] }));
    const toggleShoppingItem = (name) => setCheckedShopping(p =>
        p.includes(name) ? p.filter(i => i !== name) : [...p, name]
    );

    // ── ESTADOS DE TELA ───────────────────────────────────────────────────────
    if (!loading && isFinanceLocked) return (
        <StateScreen theme={theme} icon="lock-alert" iconColor="#FF3B30"
            RootComponent={RootComponent}
            title="ACESSO BLOQUEADO"
            desc={"Seu plano venceu e o acesso ao Cardápio foi suspenso.\n\nFale com o Coach para renovar."}
        >
            <TouchableOpacity style={styles.wppBtn}
                onPress={() => Linking.openURL('https://wa.me/5541997991346?text=Coach, preciso renovar meu plano!')}
            >
                <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 14 }}>FALAR COM O COACH</Text>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
            </TouchableOpacity>
        </StateScreen>
    );

    if (!loading && accessDenied) return (
        <StateScreen theme={theme} icon="lock-outline" iconColor={theme.textSecondary}
            RootComponent={RootComponent}
            title="ÁREA RESTRITA"
            desc="O módulo de nutrição é exclusivo para atletas da Consultoria Completa."
        />
    );

    if (loading) return (
        <View style={[styles.centered, { backgroundColor: theme.bg }]}>
            <ActivityIndicator size="large" color={theme.accent} />
        </View>
    );

    if (!diet) return (
        <StateScreen theme={theme} icon="chef-hat" RootComponent={RootComponent}
            title="QUASE LÁ!"
            desc="O Coach está finalizando seu plano alimentar. Volte em breve!"
        >
            <TouchableOpacity style={[styles.refreshBtn, { borderColor: theme.border }]}
                onPress={() => user?.id && fetchDiet(user.id)}
            >
                <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>ATUALIZAR TELA</Text>
            </TouchableOpacity>
        </StateScreen>
    );

    // ── RENDER PRINCIPAL ──────────────────────────────────────────────────────
    return (
        <RootComponent style={{
            height:          isWeb ? windowHeight : undefined,
            flex:            isWeb ? undefined : 1,
            backgroundColor: theme.bg,
        }}>
            <View style={{
                flex: 1, width: '100%',
                maxWidth: isWeb ? 480 : '100%',
                alignSelf: 'center',
                backgroundColor: theme.bg,
            }}>

                {/* ── HEADER FIXO ───────────────────────────────────────────── */}
                <View style={[styles.topBar, { backgroundColor: theme.bg }]}>
                    {/* TABS PRINCIPAIS */}
                    <View style={[styles.mainTabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {[
                            { key: 'DIETA',  label: 'CARDÁPIO', icon: 'silverware-fork-knife' },
                            { key: 'PAINEL', label: 'PAINEL',   icon: 'view-dashboard'         },
                        ].map(tab => {
                            const isActive = activeTab === tab.key;
                            return (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.tabBtn, isActive && { backgroundColor: theme.accent }]}
                                    onPress={() => setActiveTab(tab.key)}
                                >
                                    <MaterialCommunityIcons
                                        name={tab.icon} size={14}
                                        color={isActive ? '#000' : theme.textSecondary}
                                    />
                                    <Text style={[styles.tabText, { color: isActive ? '#000' : theme.textSecondary }]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── CONTEÚDO ──────────────────────────────────────────────── */}
                <Animated.ScrollView
                    style={{ flex: 1, opacity: fadeAnim }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {activeTab === 'DIETA' ? (

                        // ── ABA CARDÁPIO ─────────────────────────────────────
                        <>
                            {/* SELETOR DE PLANO — só aparece quando há escolha real (base + estratégia não-exclusiva) */}
                            {hasChoice ? (
                                <View style={[styles.planSwitcher, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <TouchableOpacity
                                        style={[styles.planOption, selectedSource === 'strategy' && { backgroundColor: theme.accent }]}
                                        onPress={() => setSelectedSource('strategy')}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons
                                            name="lightning-bolt" size={14}
                                            color={selectedSource === 'strategy' ? '#000' : theme.textSecondary}
                                        />
                                        <Text
                                            style={[styles.planOptionText, { color: selectedSource === 'strategy' ? '#000' : theme.textSecondary }]}
                                            numberOfLines={1}
                                        >
                                            {strategyDiet.strategyName}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.planOption, selectedSource === 'base' && { backgroundColor: theme.accent }]}
                                        onPress={() => setSelectedSource('base')}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialCommunityIcons
                                            name="food-apple" size={14}
                                            color={selectedSource === 'base' ? '#000' : theme.textSecondary}
                                        />
                                        <Text style={[styles.planOptionText, { color: selectedSource === 'base' ? '#000' : theme.textSecondary }]}>
                                            Plano Padrão
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                // Estratégia exclusiva (ou só existe um plano) — mantém o aviso simples, sem seletor
                                diet?.isStrategy && (
                                    <View style={[styles.strategyBanner, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                                        <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.accent} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={{ color: theme.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1 }}>ESTRATÉGIA ATIVA</Text>
                                            <Text style={{ color: theme.text, fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>{diet.strategyName}</Text>
                                        </View>
                                    </View>
                                )
                            )}

                            {/* Header contextual */}
                            <DietHeader
                                theme={theme}
                                user={user}
                                visibleMeals={visibleMeals}
                                activeDayType={activeDayType}
                                diet={diet}
                            />

                            {/* Seletor de tipo de dia (cards deslizáveis) */}
                            <DayTypeSelector
                                theme={theme}
                                allMeals={diet?.meals}
                                activeType={activeDayType}
                                onChange={setActiveDayType}
                            />

                            {/* Barra de progresso */}
                            <DietProgressBar
                                theme={theme}
                                meals={visibleMeals}
                                checkedMeals={checkedMeals}
                            />

                            {/* Refeições */}
                            {visibleMeals.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={theme.textSecondary} />
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Dia Livre</Text>
                                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                                        Nenhuma refeição cadastrada para este dia.
                                    </Text>
                                </View>
                            ) : (
                                visibleMeals.map(meal => (
                                    <CleanMealCard
                                        key={meal.id}
                                        meal={meal}
                                        theme={theme}
                                        isChecked={!!checkedMeals[meal.id]}
                                        onToggleCheck={toggleMealCheck}
                                    />
                                ))
                            )}
                        </>

                    ) : (

                        // ── ABA PAINEL ───────────────────────────────────────
                        <>
                            {/* ── BLOCO 1: FERRAMENTAS DO DIA ─────────────── */}
                            <View style={[styles.panelSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.panelSectionHeader}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={14} color={theme.accent} />
                                    <Text style={[styles.panelSectionTitle, { color: theme.text }]}>
                                        FERRAMENTAS DO DIA
                                    </Text>
                                </View>

                                {/* Water tracker */}
                                <WaterTracker theme={theme} studentId={user?.id} weight={user?.peso} />

                                {/* Progresso do dia */}
                                {visibleMeals.length > 0 && (
                                    <DietProgressBar
                                        theme={theme}
                                        meals={visibleMeals}
                                        checkedMeals={checkedMeals}
                                    />
                                )}

                                {/* Botões de ação */}
                                <View style={styles.toolsRow}>
                                    <TouchableOpacity
                                        style={[styles.toolBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                        onPress={() => setShoppingOpen(true)}
                                    >
                                        <MaterialCommunityIcons name="cart-outline" size={22} color={theme.accent} />
                                        <View>
                                            <Text style={[styles.toolTitle, { color: theme.text }]}>MERCADO</Text>
                                            <Text style={[styles.toolSub, { color: theme.textSecondary }]}>Sua lista</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toolBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                        onPress={() => setSurveyVisible(true)}
                                    >
                                        <MaterialCommunityIcons name="pencil-outline" size={22} color={theme.accent} />
                                        <View>
                                            <Text style={[styles.toolTitle, { color: theme.text }]}>AJUSTES</Text>
                                            <Text style={[styles.toolSub, { color: theme.textSecondary }]}>Mudar plano</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ── BLOCO 2: GUIAS E EDUCAÇÃO ────────────────── */}
<View style={[styles.panelSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <View style={styles.panelSectionHeader}>
        <MaterialCommunityIcons name="book-open-outline" size={14} color={theme.accent} />
        <Text style={[styles.panelSectionTitle, { color: theme.text }]}>
            GUIAS E ESTRATÉGIAS
        </Text>
    </View>
    
    <FreeMealGuide theme={theme} diet={diet} />
    
    <DietMindsetPanel
        theme={theme}
        userId={user?.id}
        goalType={goalType}
        diet={diet}
    />
</View>
                        </>
                    )}
                </Animated.ScrollView>
            </View>

            {/* ── MODAIS ────────────────────────────────────────────────────── */}
            <DietSurveyModal
                visible={surveyVisible}
                onClose={() => setSurveyVisible(false)}
                theme={theme}
                userId={user?.id}
            />
            <ShoppingListModal
                visible={shoppingOpen}
                onClose={() => setShoppingOpen(false)}
                theme={theme}
                meals={diet?.meals ?? []}
                checkedShoppingItems={checkedShopping}
                toggleShoppingItem={toggleShoppingItem}
            />
        </RootComponent>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    stateTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    stateDesc:  { fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
    refreshBtn: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 20 },
    wppBtn:     { marginTop: 30, backgroundColor: '#25D366', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },

    topBar: {
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 12,
    },
    mainTabs: {
        flexDirection: 'row', borderRadius: 16,
        padding: 4, borderWidth: 1, gap: 4,
    },
    tabBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        paddingVertical: 10, borderRadius: 12,
    },
    tabText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },

    planSwitcher: {
        flexDirection: 'row', borderRadius: 16,
        padding: 4, borderWidth: 1, gap: 4,
        marginBottom: 16,
    },
    planOption: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 12,
    },
    planOptionText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },

    strategyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },

    emptyBox:   { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 24, marginTop: 10 },
    emptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 10 },
    emptyDesc:  { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },

    // Painel
    panelSection: {
        borderRadius: 20, borderWidth: 1,
        padding: 16, marginBottom: 16,
    },
    panelSectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: 6, marginBottom: 16,
    },
    panelSectionTitle: {
        fontSize: 11, fontWeight: '900', letterSpacing: 1,
    },
    toolsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    toolBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        gap: 12, padding: 16, borderRadius: 16, borderWidth: 1,
    },
    toolTitle: { fontSize: 12, fontWeight: '900' },
    toolSub:   { fontSize: 10, fontWeight: '700', marginTop: 1 },
});