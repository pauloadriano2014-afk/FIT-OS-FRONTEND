// src/screens/DietScreen.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Linking,
    Animated, useWindowDimensions, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// ─── HELPERS (COM CORREÇÃO DE CALORIAS) ──────────────────────────────────────
const calcItemMacros = (item) => {
    // Busca a quantidade real
    const amount = parseFloat(item.gram_amount) || parseFloat(item.amount) || 0;
    
    // Busca os valores base (por 100g) que vieram do banco
    const kcal100 = parseFloat(item.calories_per_100) || parseFloat(item.calories) || 0;
    const p100 = parseFloat(item.p) || parseFloat(item.protein) || 0;
    const c100 = parseFloat(item.c) || parseFloat(item.carbs) || 0;
    const f100 = parseFloat(item.f) || parseFloat(item.fats) || 0;

    // Regra de 3 para não zerar
    return {
        kcal: Math.round((kcal100 * amount) / 100),
        prot: Math.round((p100 * amount) / 100),
        carb: Math.round((c100 * amount) / 100),
        fat:  Math.round((f100 * amount) / 100),
    };
};

const calcMealMacros = (meal) => {
    const groups = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    
    return Object.values(groups).reduce((sum, group) => {
        const m = calcItemMacros(group[0]); // Considera o primeiro item do grupo "OU"
        return { kcal: sum.kcal + m.kcal, prot: sum.prot + m.prot, carb: sum.carb + m.carb, fat: sum.fat + m.fat };
    }, { kcal: 0, prot: 0, carb: 0, fat: 0 });
};

const parseWaterMl = (str) => {
    if (!str) return 3150;
    const s = String(str).toLowerCase();
    const num = parseFloat(s);
    if (s.includes('litro') || (s.includes('l') && !s.includes('ml'))) return Math.round(num * 1000);
    if (s.includes('ml')) return Math.round(num);
    if (num > 0 && num < 20) return Math.round(num * 1000);
    return Math.round(num) || 3150;
};

// ─── COMPONENTES DE UI ────────────────────────────────────────────────────────

function DaySelector({ theme }) {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const today = new Date().getDay();
    const [activeDay, setActiveDay] = useState(today);

    return (
        <View style={[styles.daySelectorContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {days.map((d, i) => {
                const isActive = activeDay === i;
                return (
                    <TouchableOpacity 
                        key={d} 
                        style={[styles.dayBtn, isActive && { backgroundColor: theme.accent }]}
                        onPress={() => setActiveDay(i)}
                    >
                        <Text style={[styles.dayText, { color: isActive ? '#000' : theme.textSecondary }]}>
                            {d}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function CleanMealCard({ meal, theme, index }) {
    const mealMacros = calcMealMacros(meal);

    // Agrupamento para tratar os substitutos (OU)
    const grouped = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const groups = Object.values(grouped);

    return (
        <View style={[styles.cleanMealCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header da Refeição */}
            <View style={styles.cleanMealHeader}>
                <View style={[styles.cleanTimeBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.cleanTimeText, { color: theme.textSecondary }]}>{meal.time || '--:--'}</Text>
                </View>
                <Text style={[styles.cleanMealTitle, { color: theme.text }]}>{meal.name?.toUpperCase()}</Text>
                <Text style={[styles.cleanMealMacros, { color: theme.accent }]}>
                    {mealMacros.kcal} KCAL
                </Text>
            </View>

            {/* Itens da Refeição */}
            <View style={styles.cleanFoodList}>
                {groups.map((group, gIdx) => (
                    <View key={gIdx} style={styles.cleanFoodGroup}>
                        {group.map((food, fIdx) => (
                            <React.Fragment key={food.id || fIdx}>
                                {fIdx > 0 && (
                                    <View style={styles.cleanOuDivider}>
                                        <View style={[styles.cleanOuLine, { backgroundColor: theme.border }]} />
                                        <Text style={[styles.cleanOuText, { color: theme.textSecondary }]}>OU</Text>
                                        <View style={[styles.cleanOuLine, { backgroundColor: theme.border }]} />
                                    </View>
                                )}
                                <View style={[styles.cleanFoodItem, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                    <View style={[styles.cleanFoodIndex, { borderColor: theme.border }]}>
                                        <Text style={[styles.cleanFoodIndexText, { color: theme.textSecondary }]}>{gIdx + 1}</Text>
                                    </View>
                                    <View style={styles.cleanFoodDetails}>
                                        <Text style={[styles.cleanFoodName, { color: theme.text }]} numberOfLines={2}>
                                            {food.amount} {food.unit} {food.name?.toUpperCase()}
                                        </Text>
                                        <Text style={[styles.cleanFoodSub, { color: theme.textSecondary }]}>
                                            {food.amount} {food.unit}
                                        </Text>
                                    </View>
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                ))}
            </View>

            {!!meal.notes && (
                <View style={[styles.cleanNoteBox, { backgroundColor: theme.bg }]}>
                    <MaterialCommunityIcons name="information-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.cleanNoteText, { color: theme.textSecondary }]}>{meal.notes}</Text>
                </View>
            )}
        </View>
    );
}

function BiofeedbackModal({ visible, onClose, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.modalHeader, { backgroundColor: theme.bg }]}>
                        <View style={[styles.modalIconWrap, { borderColor: theme.accent }]}>
                            <MaterialCommunityIcons name="heart-pulse" size={24} color={theme.accent} />
                        </View>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>BIOFEEDBACK</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 10, letterSpacing: 1 }}>RELATÓRIO DIÁRIO</Text>
                        <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        {/* Fake selectors just for UI layout based on print */}
                        <Text style={[styles.modalLabel, { color: theme.textSecondary }]}><MaterialCommunityIcons name="silverware-fork-knife" /> NÍVEL DE FOME</Text>
                        <View style={styles.modalOptionsRow}>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>BAIXA</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border, backgroundColor: theme.bg }]}><Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>NORMAL</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>ALTA</Text></View>
                        </View>

                        <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 15 }]}><MaterialCommunityIcons name="stomach" /> DIGESTÃO E INTESTINO</Text>
                        <View style={styles.modalOptionsRow}>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>RUIM</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border, backgroundColor: theme.bg }]}><Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>NORMAL</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>PERFEITO</Text></View>
                        </View>

                        <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 15 }]}><MaterialCommunityIcons name="battery-charging" /> ENERGIA GERAL</Text>
                        <View style={styles.modalOptionsRow}>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>BAIXA</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>MÉDIA</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border, backgroundColor: theme.bg }]}><Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>ALTA</Text></View>
                        </View>

                        <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: theme.textSecondary }]} onPress={onClose}>
                            <Text style={{ color: theme.surface, fontWeight: '900', letterSpacing: 1 }}>REGISTRAR NO DIÁRIO</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DietScreen({ route }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    const [diet, setDiet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [accessDenied, setAccessDenied] = useState(false);
    const [activeTab, setActiveTab] = useState('DIETA'); // DIETA | PAINEL
    
    // Panel States
    const [waterConsumed, setWaterConsumed] = useState(0);
    const [bioModalVisible, setBioModalVisible] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const initialize = async () => {
            try {
                let u = route.params?.userData;
                if (typeof u === 'string') u = JSON.parse(u);
                if (!u || !u.id) {
                    const stored = await AsyncStorage.getItem('user');
                    if (stored) u = JSON.parse(stored);
                }
                if (!u || !u.id) { setLoading(false); return; }
                setUser(u);
                
                const isElite = u.plan === 'ELITE' || u.plan === 'VIP';
                if (!u.dietModule && !isElite) { setAccessDenied(true); setLoading(false); return; }
                fetchDiet(u.id);
            } catch (e) {
                console.error('Erro:', e);
                setLoading(false);
            }
        };
        initialize();
    }, []);

    const fetchDiet = async (userId) => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/diet/${userId}?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.meals && data.meals.length > 0) {
                    setDiet(data);
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                } else setDiet(null);
            } else setDiet(null);
        } catch (e) {
            setDiet(null);
        } finally {
            setLoading(false);
        }
    };

    const waterTarget = useMemo(() => parseWaterMl(diet?.waterIntake), [diet]);

    // ── TELA DE BLOQUEIO ──
    if (!loading && accessDenied) {
        return (
            <RootComponent style={[styles.centered, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="lock-outline" size={60} color={theme.textSecondary} style={{marginBottom: 20}} />
                <Text style={[styles.stateTitle, { color: theme.text }]}>ÁREA RESTRITA</Text>
                <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>O módulo de nutrição integrado é exclusivo para alunos do plano completo.</Text>
            </RootComponent>
        );
    }

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    if (!diet) {
        return (
            <RootComponent style={[styles.centered, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="chef-hat" size={60} color={theme.accent} style={{marginBottom: 20}} />
                <Text style={[styles.stateTitle, { color: theme.text }]}>QUASE LÁ!</Text>
                <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>O Coach está calculando seus macros e finalizando o plano. Volte em breve!</Text>
                <TouchableOpacity style={[styles.refreshBtn, { borderColor: theme.border }]} onPress={() => user?.id && fetchDiet(user.id)}>
                    <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>ATUALIZAR TELA</Text>
                </TouchableOpacity>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={{ height: isWeb ? windowHeight : undefined, flex: isWeb ? undefined : 1, backgroundColor: theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg }}>
                
                {/* HEADER FIXO & ABAS */}
                <View style={[styles.topHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={styles.topRow}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <MaterialCommunityIcons name="calendar-month" size={16} color={theme.textSecondary} />
                            <Text style={[styles.topHeaderTitle, { color: theme.textSecondary }]}>PROTOCOLOS</Text>
                        </View>
                        <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                            <MaterialCommunityIcons name="file-download-outline" size={14} color={theme.text} />
                            <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR DIETA</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Seletor DIETA / PAINEL */}
                    <View style={[styles.mainTabs, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'DIETA' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('DIETA')}>
                            <Text style={[styles.mainTabText, { color: activeTab === 'DIETA' ? '#000' : theme.textSecondary }]}>DIETA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'PAINEL' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('PAINEL')}>
                            <Text style={[styles.mainTabText, { color: activeTab === 'PAINEL' ? '#000' : theme.textSecondary }]}>PAINEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
                    
                    {activeTab === 'DIETA' ? (
                        <>
                            <DaySelector theme={theme} />
                            
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DIETA DIÁRIA</Text>
                            </View>

                            {diet.meals.map((meal, index) => (
                                <CleanMealCard key={meal.id} meal={meal} theme={theme} index={index} />
                            ))}
                        </>
                    ) : (
                        <>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SEU PAINEL</Text>
                            </View>

                            {/* TRACKER DE ÁGUA MODERNIZADO */}
                            <View style={[styles.waterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.waterTop}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                        <View style={styles.waterIconCircle}>
                                            <MaterialCommunityIcons name="water-outline" size={20} color="#32ADE6" />
                                        </View>
                                        <View>
                                            <Text style={[styles.waterTitle, { color: theme.text }]}>HIDRATAÇÃO</Text>
                                            <Text style={[styles.waterMeta, { color: theme.textSecondary }]}>META MÍNIMA: {(waterTarget/1000).toFixed(2)}L</Text>
                                        </View>
                                    </View>
                                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.border} />
                                </View>

                                <View style={styles.waterProgressRow}>
                                    <Text style={styles.waterValueBig}>{(waterConsumed/1000).toFixed(2)}L</Text>
                                    <Text style={[styles.waterValueSmall, { color: theme.textSecondary }]}>/ {(waterTarget/1000).toFixed(2)}L</Text>
                                </View>
                                
                                <View style={[styles.progressBarBg, { backgroundColor: theme.bg }]}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min((waterConsumed/waterTarget)*100, 100)}%` }]} />
                                </View>

                                <View style={styles.waterBtnsRow}>
                                    <TouchableOpacity style={[styles.waterBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setWaterConsumed(w => w + 250)}>
                                        <Text style={styles.waterBtnText}>+ 250ml</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.waterBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setWaterConsumed(w => w + 500)}>
                                        <Text style={styles.waterBtnText}>+ 500ml</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.waterResetBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => setWaterConsumed(0)}>
                                        <MaterialCommunityIcons name="refresh" size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* GRID DE FERRAMENTAS */}
                            <View style={styles.toolsGrid}>
                                <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => alert('Lista de Mercado será gerada em breve.')}>
                                    <MaterialCommunityIcons name="cart-outline" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>MERCADO</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>LISTA AUTOMÁTICA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setBioModalVisible(true)}>
                                    <MaterialCommunityIcons name="heart-pulse" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>RELATÓRIO</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>BIOFEEDBACK</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ALERTA DE FURO NA DIETA */}
                            <TouchableOpacity style={[styles.dangerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.dangerIcon}><MaterialCommunityIcons name="fire" size={24} color="#FF6B35" /></View>
                                <View style={{justifyContent: 'center'}}>
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>SAIU DO PLANO?</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>REGISTRAR REFEIÇÃO LIVRE</Text>
                                </View>
                            </TouchableOpacity>

                        </>
                    )}
                </Animated.ScrollView>
            </View>

            <BiofeedbackModal visible={bioModalVisible} onClose={() => setBioModalVisible(false)} theme={theme} />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    stateTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    stateDesc: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
    refreshBtn: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 20 },

    topHeader: { padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, borderBottomWidth: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    topHeaderTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
    downloadText: { fontSize: 10, fontWeight: '900' },
    
    mainTabs: { flexDirection: 'row', borderRadius: 12, padding: 4, borderWidth: 1 },
    mainTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    mainTabText: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },

    daySelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 5, borderRadius: 20, borderWidth: 1, marginBottom: 25 },
    dayBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16 },
    dayText: { fontSize: 10, fontWeight: '900' },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    greenStrip: { width: 4, height: 16, borderRadius: 2 },
    sectionTitle: { fontSize: 12, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1 },

    // CLEAN MEAL CARD (Inspirado no Print 1)
    cleanMealCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1 },
    cleanMealHeader: { marginBottom: 20 },
    cleanTimeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
    cleanTimeText: { fontSize: 11, fontWeight: 'bold' },
    cleanMealTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    cleanMealMacros: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
    
    cleanFoodList: { gap: 10 },
    cleanFoodGroup: { gap: 10 },
    cleanFoodItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
    cleanFoodIndex: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cleanFoodIndexText: { fontSize: 12, fontWeight: 'bold' },
    cleanFoodDetails: { flex: 1 },
    cleanFoodName: { fontSize: 13, fontWeight: '900', fontStyle: 'italic', marginBottom: 2 },
    cleanFoodSub: { fontSize: 11, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.05)', alignSelf: 'flex-start', paddingHorizontal: 6, borderRadius: 4, overflow: 'hidden' },

    cleanOuDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingHorizontal: 10 },
    cleanOuLine: { flex: 1, height: 1 },
    cleanOuText: { fontSize: 10, fontWeight: 'bold', marginHorizontal: 10 },

    cleanNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, padding: 12, borderRadius: 12 },
    cleanNoteText: { fontSize: 12, fontStyle: 'italic' },

    // PAINEL (Inspirado no Print 3)
    waterCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
    waterTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    waterIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#32ADE615', alignItems: 'center', justifyContent: 'center' },
    waterTitle: { fontSize: 14, fontWeight: '900' },
    waterMeta: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
    waterProgressRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
    waterValueBig: { fontSize: 32, fontWeight: '900', color: '#32ADE6', fontStyle: 'italic', letterSpacing: -1 },
    waterValueSmall: { fontSize: 12, fontWeight: 'bold', marginLeft: 5, marginBottom: 6 },
    progressBarBg: { height: 8, borderRadius: 4, width: '100%', marginBottom: 20, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#32ADE6', borderRadius: 4 },
    waterBtnsRow: { flexDirection: 'row', gap: 10 },
    waterBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    waterBtnText: { color: '#32ADE6', fontWeight: '900', fontSize: 12 },
    waterResetBtn: { width: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

    toolsGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    toolCard: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1 },
    toolTitle: { fontSize: 13, fontWeight: '900' },
    toolSub: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },
    
    dangerCard: { flexDirection: 'row', padding: 20, borderRadius: 20, borderWidth: 1, gap: 15 },
    dangerIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FF6B3515', alignItems: 'center', justifyContent: 'center' },

    // BIOFEEDBACK MODAL
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
    modalHeader: { padding: 25, alignItems: 'center', position: 'relative' },
    modalIconWrap: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 20, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    modalClose: { position: 'absolute', top: 20, right: 20, padding: 5 },
    modalBody: { padding: 25 },
    modalLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    modalOptionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    modalOption: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    modalSubmit: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }
});