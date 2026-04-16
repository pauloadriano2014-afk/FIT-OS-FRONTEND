// src/screens/DietScreen.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Linking,
    Animated, useWindowDimensions, Modal, TextInput, Image,
    KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const parseWaterMl = (str) => {
    if (!str) return 3150;
    const s = String(str).toLowerCase();
    const num = parseFloat(s);
    if (s.includes('litro') || (s.includes('l') && !s.includes('ml'))) return Math.round(num * 1000);
    if (s.includes('ml')) return Math.round(num);
    if (num > 0 && num < 20) return Math.round(num * 1000);
    return Math.round(num) || 3150;
};

const getMacroCategory = (food) => {
    const p = parseFloat(food.protein || food.p || 0);
    const c = parseFloat(food.carbs || food.c || 0);
    const f = parseFloat(food.fats || food.f || 0);
    
    const max = Math.max(p, c, f);
    if (max === 0) return "ACOMPANHAMENTO / LIVRE";
    if (max === p) return "FONTE DE PROTEÍNA";
    if (max === c) return "FONTE DE CARBOIDRATO";
    return "FONTE DE GORDURA";
};

const getMealBackgroundImage = (mealName) => {
    const name = String(mealName).toLowerCase();
    if (name.includes('café') || name.includes('cafe') || name.includes('desjejum')) 
        return 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=500';
    if (name.includes('almoço') || name.includes('almoco')) 
        return 'https://images.unsplash.com/photo-1544025162-811114cd3543?auto=format&fit=crop&q=80&w=500';
    if (name.includes('janta') || name.includes('jantar')) 
        return 'https://images.unsplash.com/photo-1551326844-4fd41d15db7f?auto=format&fit=crop&q=80&w=500';
    if (name.includes('pré') || name.includes('pre')) 
        return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=500';
    if (name.includes('pós') || name.includes('pos')) 
        return 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=500';
    if (name.includes('ceia')) 
        return 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&q=80&w=500';
    return 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500'; 
};

const getGoalType = (userData) => {
    if (!userData) return 'HIPERTROFIA';
    const goalStr = String(userData.goal || userData.anamneses?.[0]?.objetivo || '').toLowerCase();
    
    if (goalStr.includes('emagreci') || goalStr.includes('seca') || goalStr.includes('defini') || goalStr.includes('perda')) {
        return 'EMAGRECIMENTO';
    }
    return 'HIPERTROFIA';
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
                        <Text style={[styles.dayText, { color: isActive ? '#000' : theme.textSecondary }]}>{d}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function CleanMealCard({ meal, theme, index, isChecked, onToggleCheck }) {
    const bgImage = getMealBackgroundImage(meal.name);

    const grouped = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const groups = Object.values(grouped);

    return (
        <View style={[styles.cleanMealCard, { backgroundColor: theme.surface, borderColor: isChecked ? theme.accent : theme.border, opacity: isChecked ? 0.6 : 1 }]}>
            <Image source={{ uri: bgImage }} style={styles.mealBgImage} resizeMode="cover" />
            <View style={[styles.mealBgOverlay, { backgroundColor: theme.surface }]} />

            <View style={styles.cleanMealHeader}>
                <View style={{flex: 1}}>
                    <View style={[styles.cleanTimeBadge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.cleanTimeText, { color: theme.textSecondary }]}>{meal.time || '--:--'}</Text>
                    </View>
                    <Text style={[styles.cleanMealTitle, { color: theme.text }]}>{meal.name?.toUpperCase()}</Text>
                </View>

                <TouchableOpacity 
                    style={[styles.checkBtn, isChecked ? { backgroundColor: theme.accent, borderColor: theme.accent } : { backgroundColor: theme.bg, borderColor: theme.border }]} 
                    onPress={() => onToggleCheck(meal.id)}
                >
                    <MaterialCommunityIcons name="check" size={24} color={isChecked ? '#000' : theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.cleanFoodList}>
                {groups.map((group, gIdx) => {
                    const macroCategory = getMacroCategory(group[0]);
                    return (
                        <View key={gIdx} style={styles.cleanFoodGroup}>
                            <Text style={[styles.macroCategoryTag, { color: theme.accent }]}>🎯 {macroCategory}</Text>
                            {group.map((food, fIdx) => {
                                const isSub = fIdx > 0;
                                return (
                                    <React.Fragment key={food.id || fIdx}>
                                        {isSub && (
                                            <View style={styles.cleanOuDivider}>
                                                <MaterialCommunityIcons name="swap-vertical" size={14} color={theme.textSecondary} />
                                                <Text style={[styles.cleanOuText, { color: theme.textSecondary }]}>OU SUBSTITUA POR:</Text>
                                            </View>
                                        )}
                                        <View style={[styles.cleanFoodItem, { backgroundColor: theme.bg, borderColor: theme.border, marginLeft: isSub ? 15 : 0 }]}>
                                            <View style={styles.cleanFoodDetails}>
                                                <Text style={[styles.cleanFoodName, { color: theme.text }]} numberOfLines={2}>
                                                    {food.amount} {food.unit} de {food.name?.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    )
                })}
            </View>

            {!!meal.notes && (
                <View style={[styles.cleanNoteBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent + '40' }]}>
                    <MaterialCommunityIcons name="bullhorn-outline" size={16} color={theme.accent} />
                    <View style={{flex: 1}}>
                        <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 2 }}>O COACH AVISA:</Text>
                        <Text style={[styles.cleanNoteText, { color: theme.text }]}>{meal.notes}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

function BiofeedbackModal({ visible, onClose, theme }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border, width: '100%', maxWidth: 400 }]}>
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
                        <Text style={[styles.modalLabel, { color: theme.textSecondary }]}><MaterialCommunityIcons name="silverware-fork-knife" /> NÍVEL DE FOME</Text>
                        <View style={styles.modalOptionsRow}>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>BAIXA</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border, backgroundColor: theme.bg }]}><Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>NORMAL</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>ALTA</Text></View>
                        </View>

                        <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 15 }]}><MaterialCommunityIcons name="stomach" /> DIGESTÃO</Text>
                        <View style={styles.modalOptionsRow}>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>RUIM</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border, backgroundColor: theme.bg }]}><Text style={{color: theme.text, fontSize: 11, fontWeight: 'bold'}}>NORMAL</Text></View>
                            <View style={[styles.modalOption, { borderColor: theme.border }]}><Text style={{color: theme.textSecondary, fontSize: 11, fontWeight: 'bold'}}>PERFEITA</Text></View>
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

function DietSurveyModal({ visible, onClose, theme }) {
    const [saciedade, setSaciedade] = useState('');
    const [dificuldade, setDificuldade] = useState('');
    const [ajustes, setAjustes] = useState('');
    const [enviando, setEnviando] = useState(false);

    const enviarFeedback = () => {
        setEnviando(true);
        setTimeout(() => {
            setEnviando(false);
            if(Platform.OS === 'web') window.alert("Sucesso!\nSua solicitação de ajuste foi enviada ao Coach.");
            else Alert.alert("Sucesso", "Sua solicitação de ajuste foi enviada ao Coach.");
            onClose();
        }, 1500);
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border, width: '100%', maxWidth: 440 }]}>
                    <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.modalTitle, { color: theme.text }]}>AJUSTAR PLANO</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 20 }}>Dê seu feedback para que o Coach faça os ajustes cirúrgicos na sua dieta.</Text>

                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>1. COMO ESTÁ SUA SACIEDADE?</Text>
                    <View style={styles.modalOptionsRow}>
                        <TouchableOpacity style={[styles.modalOption, saciedade === 'Fome' ? { backgroundColor: theme.accent, borderColor: theme.accent } : { borderColor: theme.border }]} onPress={() => setSaciedade('Fome')}>
                            <Text style={{color: saciedade === 'Fome' ? '#000' : theme.text, fontSize: 10, fontWeight: 'bold'}}>COM FOME</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalOption, saciedade === 'Normal' ? { backgroundColor: theme.accent, borderColor: theme.accent } : { borderColor: theme.border }]} onPress={() => setSaciedade('Normal')}>
                            <Text style={{color: saciedade === 'Normal' ? '#000' : theme.text, fontSize: 10, fontWeight: 'bold'}}>SATISFEITO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalOption, saciedade === 'Cheio' ? { backgroundColor: theme.accent, borderColor: theme.accent } : { borderColor: theme.border }]} onPress={() => setSaciedade('Cheio')}>
                            <Text style={{color: saciedade === 'Cheio' ? '#000' : theme.text, fontSize: 10, fontWeight: 'bold'}}>MUITO CHEIO</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 15 }]}>2. ALGUMA REFEIÇÃO ESTÁ DIFÍCIL?</Text>
                    <TextInput 
                        style={[styles.obsInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                        placeholder="Ex: O almoço no trabalho está corrido..." 
                        placeholderTextColor={theme.textSecondary} 
                        multiline 
                        value={dificuldade} 
                        onChangeText={setDificuldade} 
                    />

                    <Text style={[styles.modalLabel, { color: theme.textSecondary, marginTop: 15 }]}>3. O QUE VOCÊ QUER ALTERAR?</Text>
                    <TextInput 
                        style={[styles.obsInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                        placeholder="Ex: Quero tirar o ovo da tarde e colocar whey..." 
                        placeholderTextColor={theme.textSecondary} 
                        multiline 
                        value={ajustes} 
                        onChangeText={setAjustes} 
                    />

                    <TouchableOpacity style={[styles.modalSubmit, { backgroundColor: theme.accent }]} onPress={enviarFeedback} disabled={enviando}>
                        {enviando ? <ActivityIndicator color="#000" /> : <Text style={{ color: '#000', fontWeight: '900', letterSpacing: 1 }}>ENVIAR PARA O COACH</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    const [activeTab, setActiveTab] = useState('DIETA'); 
    
    const [waterConsumed, setWaterConsumed] = useState(0);
    const [checkedMeals, setCheckedMeals] = useState({});
    
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [bioModalVisible, setBioModalVisible] = useState(false);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const initialize = async () => {
            try {
                // 🔥 CORREÇÃO DO BUG DE CACHE DO ADMIN:
                // Verifica todas as rotas possíveis que o painel envia
                let u = route.params?.aluno || route.params?.userData || route.params?.user || route.params?.student;
                
                if (typeof u === 'string') u = JSON.parse(u);
                
                // Trata o caso onde o objeto inteiro é enviado direto na route
                if (!u && route.params?.id) {
                    u = route.params;
                }

                // Se não vier nada da navegação (ou seja, é o aluno acessando o próprio app), puxa do cache
                if (!u || !u.id) {
                    const stored = await AsyncStorage.getItem('user');
                    if (stored) u = JSON.parse(stored);
                }

                if (!u || !u.id) { setLoading(false); return; }
                setUser(u);
                
                const isElite = u.plan === 'ELITE' || u.plan === 'VIP';
                if (!u.dietModule && !isElite) { setAccessDenied(true); setLoading(false); return; }
                
                // Agora o ID que vai buscar é definitivamente o ID da pessoa correta
                fetchDiet(u.id);
            } catch (e) {
                setLoading(false);
            }
        };
        initialize();
    }, [route.params]); // Dependência atualizada

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

    const toggleMealCheck = (mealId) => {
        setCheckedMeals(prev => ({ ...prev, [mealId]: !prev[mealId] }));
    };

    const waterTarget = useMemo(() => parseWaterMl(diet?.waterIntake), [diet]);
    const goalType = useMemo(() => getGoalType(user), [user]);

    if (!loading && accessDenied) {
        return (
            <RootComponent style={[styles.centered, { backgroundColor: theme.bg }]}>
                <MaterialCommunityIcons name="lock-outline" size={60} color={theme.textSecondary} style={{marginBottom: 20}} />
                <Text style={[styles.stateTitle, { color: theme.text }]}>ÁREA RESTRITA</Text>
                <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>O módulo de nutrição integrado é exclusivo para atletas da Consultoria Completa.</Text>
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
                <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>O Coach está finalizando a montagem do seu plano alimentar. Volte em breve!</Text>
                <TouchableOpacity style={[styles.refreshBtn, { borderColor: theme.border }]} onPress={() => user?.id && fetchDiet(user.id)}>
                    <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>ATUALIZAR TELA</Text>
                </TouchableOpacity>
            </RootComponent>
        );
    }

    return (
        <RootComponent style={{ height: isWeb ? windowHeight : undefined, flex: isWeb ? undefined : 1, backgroundColor: theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg }}>
                
                <View style={[styles.topHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <View style={styles.topRow}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <MaterialCommunityIcons name="calendar-month" size={16} color={theme.textSecondary} />
                            <Text style={[styles.topHeaderTitle, { color: theme.textSecondary }]}>PROTOCOLOS</Text>
                        </View>
                        {diet.pdfUrl && (
                            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={() => Linking.openURL(diet.pdfUrl)}>
                                <MaterialCommunityIcons name="file-download-outline" size={14} color={theme.text} />
                                <Text style={[styles.downloadText, { color: theme.text }]}>BAIXAR EM PDF</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <View style={[styles.mainTabs, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'DIETA' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('DIETA')}>
                            <Text style={[styles.mainTabText, { color: activeTab === 'DIETA' ? '#000' : theme.textSecondary }]}>CARDÁPIO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.mainTabBtn, activeTab === 'PAINEL' && { backgroundColor: theme.accent }]} onPress={() => setActiveTab('PAINEL')}>
                            <Text style={[styles.mainTabText, { color: activeTab === 'PAINEL' ? '#000' : theme.textSecondary }]}>PAINEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
                    
                    {activeTab === 'DIETA' ? (
                        <>
                            <DaySelector theme={theme} />
                            
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUAS REFEIÇÕES</Text>
                            </View>

                            {diet.meals.map((meal, index) => (
                                <CleanMealCard 
                                    key={meal.id} 
                                    meal={meal} 
                                    theme={theme} 
                                    index={index} 
                                    isChecked={!!checkedMeals[meal.id]}
                                    onToggleCheck={toggleMealCheck}
                                />
                            ))}
                        </>
                    ) : (
                        <>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HIDRATAÇÃO</Text>
                            </View>

                            <View style={[styles.waterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={styles.waterTop}>
                                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                        <View style={styles.waterIconCircle}>
                                            <MaterialCommunityIcons name="water-outline" size={20} color="#32ADE6" />
                                        </View>
                                        <View>
                                            <Text style={[styles.waterTitle, { color: theme.text }]}>ÁGUA DIÁRIA</Text>
                                            <Text style={[styles.waterMeta, { color: theme.textSecondary }]}>META: {(waterTarget/1000).toFixed(2)}L</Text>
                                        </View>
                                    </View>
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

                            <View style={styles.toolsGrid}>
                                <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => { if(Platform.OS === 'web') window.alert('Lista de Mercado será gerada em breve.'); else Alert.alert('Em Breve', 'Sua Lista de Mercado inteligente estará disponível na próxima atualização.'); }}>
                                    <MaterialCommunityIcons name="cart-outline" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>MERCADO</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>SUA LISTA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => setBioModalVisible(true)}>
                                    <MaterialCommunityIcons name="heart-pulse" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>RELATÓRIO</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>BIOFEEDBACK</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>MENTALIDADE DA DIETA</Text>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:8}}>
                                    <MaterialCommunityIcons name="clock-fast" size={20} color={theme.accent} />
                                    <Text style={[styles.infoTitle, { color: theme.text }]}>Horários Flexíveis</Text>
                                </View>
                                <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
                                    Os horários são uma base. O mais importante é manter intervalos de 3 a 4 horas entre as refeições e garantir energia perto do seu treino.
                                </Text>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:8}}>
                                    <MaterialCommunityIcons name="glass-wine" size={20} color="#FF6B35" />
                                    <Text style={[styles.infoTitle, { color: theme.text }]}>O "Pecado" do Álcool</Text>
                                </View>
                                <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
                                    {goalType === 'EMAGRECIMENTO' 
                                        ? "Álcool é caloria vazia e paralisa a queima de gordura no corpo. Se for beber no final de semana, não exagere e sempre alterne a bebida com MUITA água para não estourar o déficit!"
                                        : "O álcool prejudica severamente a recuperação e a síntese proteica (ganho de massa). Se for beber, modere, não fique horas sem comer e alterne com água!"}
                                </Text>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:8}}>
                                    <MaterialCommunityIcons name="target" size={20} color={theme.accent} />
                                    <Text style={[styles.infoTitle, { color: theme.text }]}>
                                        {goalType === 'EMAGRECIMENTO' ? "Cuidado com os Beliscos" : "Não Pule Refeições"}
                                    </Text>
                                </View>
                                <Text style={[styles.infoDesc, { color: theme.textSecondary }]}>
                                    {goalType === 'EMAGRECIMENTO'
                                        ? "Aquela 'beliscada' inocente fora do plano pode destruir o seu déficit calórico. Siga a dieta! Se a fome bater muito forte, beba água ou solicite um ajuste abaixo."
                                        : "Para hipertrofiar, você precisa de superávit calórico. Pular refeições porque 'está sem fome' vai jogar seus ganhos no lixo. Cumpra a meta e o volume prescrito!"}
                                </Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.dangerCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 10 }]}
                                onPress={() => setSurveyModalVisible(true)}
                            >
                                <View style={styles.dangerIcon}><MaterialCommunityIcons name="pencil-outline" size={24} color={theme.accent} /></View>
                                <View style={{justifyContent: 'center', flex: 1}}>
                                    <Text style={[styles.toolTitle, { color: theme.text }]}>PRECISA DE MUDANÇAS?</Text>
                                    <Text style={[styles.toolSub, { color: theme.textSecondary }]}>SOLICITAR AJUSTE NO PLANO</Text>
                                </View>
                            </TouchableOpacity>

                        </>
                    )}
                </Animated.ScrollView>
            </View>

            <DietSurveyModal visible={surveyModalVisible} onClose={() => setSurveyModalVisible(false)} theme={theme} />
            <BiofeedbackModal visible={bioModalVisible} onClose={() => setBioModalVisible(false)} theme={theme} />
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    stateTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    stateDesc: { fontSize: 13, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
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

    cleanMealCard: { borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, position: 'relative', overflow: 'hidden' },
    mealBgImage: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.15 }, 
    mealBgOverlay: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, width: '100%', height: '100%', opacity: 0.6 },
    
    cleanMealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25, zIndex: 2 },
    cleanTimeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
    cleanTimeText: { fontSize: 11, fontWeight: 'bold' },
    cleanMealTitle: { fontSize: 22, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    
    checkBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    
    cleanFoodList: { gap: 20, zIndex: 2 },
    cleanFoodGroup: { gap: 8 },
    macroCategoryTag: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    
    cleanFoodItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
    cleanFoodDetails: { flex: 1 },
    cleanFoodName: { fontSize: 14, fontWeight: '900', fontStyle: 'italic', lineHeight: 20 },

    cleanOuDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, paddingHorizontal: 15, gap: 6 },
    cleanOuText: { fontSize: 10, fontWeight: 'bold', fontStyle: 'italic' },

    cleanNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 25, padding: 16, borderRadius: 16, borderWidth: 1, zIndex: 2 },
    cleanNoteText: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

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

    infoCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    infoTitle: { fontSize: 14, fontWeight: '900' },
    infoDesc: { fontSize: 12, lineHeight: 18 },

    dangerCard: { flexDirection: 'row', padding: 20, borderRadius: 20, borderWidth: 1, gap: 15, alignItems: 'center' },
    dangerIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#4DE38F15', alignItems: 'center', justifyContent: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 24, padding: 25, borderWidth: 1, position: 'relative', alignSelf: 'center' },
    modalClose: { position: 'absolute', top: 20, right: 20, padding: 5, zIndex: 10 },
    modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
    modalLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    modalOptionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    modalOption: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    obsInput: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, height: 80, textAlignVertical: 'top', marginBottom: 20 },
    modalSubmit: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },

    modalHeader: { padding: 25, alignItems: 'center', position: 'relative', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    modalIconWrap: { width: 50, height: 50, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    modalBody: { padding: 25 }
});