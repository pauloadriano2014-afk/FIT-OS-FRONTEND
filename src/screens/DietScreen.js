// src/screens/DietScreen.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView,
    TouchableOpacity, ActivityIndicator, Platform, Linking,
    Animated, useWindowDimensions, Modal, TextInput, Image,
    KeyboardAvoidingView, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

// 🔥 Importando os Componentes Modularizados
import WaterTracker from '../components/ClientDiet/WaterTracker';
import ShoppingListModal from '../components/ClientDiet/ShoppingListModal';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
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

function RoutineSelector({ theme, types, activeType, onChange }) {
    return (
        <View style={[styles.daySelectorContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {types.map(t => {
                const isActive = activeType === t;
                return (
                    <TouchableOpacity 
                        key={t} 
                        style={[styles.dayBtn, isActive && { backgroundColor: theme.accent }]}
                        onPress={() => onChange(t)}
                    >
                        <Text style={[styles.dayText, { color: isActive ? '#000' : theme.textSecondary }]}>
                            {t === 'PADRÃO' ? 'GERAL' : t}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

function CleanMealCard({ meal, theme, index, isChecked, onToggleCheck }) {
    const bgImage = getMealBackgroundImage(meal.name);
    // Controla quais grupos de substituição estão abertos
    const [showSubs, setShowSubs] = useState({});

    const grouped = meal.items.reduce((acc, item) => {
        const key = item.substitutionGroupId || item.id || Math.random().toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const groups = Object.values(grouped);

    const toggleSubs = (idx) => {
        setShowSubs(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

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
                    const mainFood = group[0];
                    const substitutes = group.slice(1);
                    const isShowingSubs = !!showSubs[gIdx];

                    return (
                        <View key={gIdx} style={styles.cleanFoodGroup}>
                            <Text style={[styles.macroCategoryTag, { color: theme.accent }]}>🎯 {macroCategory}</Text>
                            
                            {/* Alimento Principal - Destaque em Verde Neon Premium */}
                            <View style={[styles.mainFoodCard, { backgroundColor: 'rgba(77, 227, 143, 0.1)', borderColor: '#4DE38F' }]}>
                                <Text style={[styles.cleanFoodName, { color: theme.text }]} numberOfLines={2}>
                                    {mainFood.amount} {mainFood.unit} de {mainFood.name?.toUpperCase()}
                                </Text>
                            </View>

                            {/* Área de Substitutos (Apenas se houver) */}
                            {substitutes.length > 0 && (
                                <>
                                    <TouchableOpacity 
                                        style={styles.showSubsBtn} 
                                        onPress={() => toggleSubs(gIdx)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.showSubsText, { color: theme.textSecondary }]}>
                                            {isShowingSubs ? 'Ocultar opções de troca' : `Gostaria de substituir este alimento? (+${substitutes.length})`}
                                        </Text>
                                        <MaterialCommunityIcons name={isShowingSubs ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                                    </TouchableOpacity>

                                    {isShowingSubs && substitutes.map((sub, sIdx) => (
                                        <View key={sIdx} style={[styles.subFoodCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                            <Text style={[styles.subFoodName, { color: theme.textSecondary }]} numberOfLines={2}>
                                                {sub.amount} {sub.unit} de {sub.name?.toUpperCase()}
                                            </Text>
                                            <MaterialCommunityIcons name="swap-horizontal" size={16} color={theme.textSecondary} />
                                        </View>
                                    ))}
                                </>
                            )}
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

function DietSurveyModal({ visible, onClose, theme, userId }) {
    const [saciedade, setSaciedade] = useState('');
    const [dificuldade, setDificuldade] = useState('');
    const [ajustes, setAjustes] = useState('');
    const [enviando, setEnviando] = useState(false);

    const enviarFeedback = async () => {
        if (!saciedade && !dificuldade && !ajustes) {
            const msg = "Preencha pelo menos um campo para enviar o feedback.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Aviso", msg);
            return;
        }

        setEnviando(true);
        try {
            const payload = {
                userId,
                satiety: saciedade,
                difficulty: dificuldade,
                requestedChanges: ajustes,
                timestamp: new Date().toISOString()
            };

            const res = await fetch('https://fitos-final.onrender.com/api/diet-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Falha ao registrar feedback");

            if(Platform.OS === 'web') window.alert("Sucesso!\nSua solicitação foi enviada direto para o painel do Coach.");
            else Alert.alert("Sucesso", "Sua solicitação foi enviada direto para o painel do Coach.");
            
            setSaciedade('');
            setDificuldade('');
            setAjustes('');
            onClose();
        } catch (error) {
            const msg = "Não foi possível enviar sua solicitação no momento. Tente novamente mais tarde.";
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert("Erro", msg);
        } finally {
            setEnviando(false);
        }
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
    
    // Abas Principais
    const [activeTab, setActiveTab] = useState('DIETA'); 
    const [activeDayType, setActiveDayType] = useState('TREINO'); 

    // Estados Locais
    const [checkedMeals, setCheckedMeals] = useState({});
    
    // Estados dos Modais
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [checkedShoppingItems, setCheckedShoppingItems] = useState([]);
    
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const initialize = async () => {
            try {
                let u = route.params?.aluno || route.params?.userData || route.params?.user || route.params?.student;
                if (typeof u === 'string') u = JSON.parse(u);
                if (!u && route.params?.id) u = route.params;

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
                setLoading(false);
            }
        };
        initialize();
    }, [route.params]);

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

    const goalType = useMemo(() => getGoalType(user), [user]);

    const availableTypes = useMemo(() => {
        if (!diet?.meals) return ['TREINO', 'CARDIO', 'DESCANSO'];
        const types = [...new Set(diet.meals.map(m => m.dayType || 'PADRÃO'))];
        const order = ['PADRÃO', 'TREINO', 'CARDIO', 'DESCANSO'];
        const present = order.filter(t => types.includes(t));
        return present.length > 0 ? present : ['TREINO'];
    }, [diet]);

    useEffect(() => {
        if (availableTypes.length > 0 && !availableTypes.includes(activeDayType)) {
            setActiveDayType(availableTypes[0]);
        }
    }, [availableTypes]);

    const visibleMeals = useMemo(() => {
        if (!diet?.meals) return [];
        return diet.meals.filter(m => (m.dayType || 'PADRÃO') === activeDayType);
    }, [diet, activeDayType]);

    // 🔥 MOTOR DA LISTA DE MERCADO (Com Multiplicador Semanal 4-2-1)
    const shoppingList = useMemo(() => {
        if (!diet?.meals) return {};
        const list = {};

        // Frequência base por semana
        const dayMultiplier = {
            'TREINO': 4,
            'CARDIO': 2,
            'DESCANSO': 1,
            'PADRÃO': 7
        };

        diet.meals.forEach((meal) => {
            const multiplier = dayMultiplier[meal.dayType || 'PADRÃO'] || 1;

            // Agrupa itens para ignorar os substitutos (não estourar a lista de compras do aluno)
            const groupedItems = meal.items?.reduce((acc, item) => {
                const key = item.substitutionGroupId || item.id || Math.random().toString();
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            if (!groupedItems) return;

            Object.values(groupedItems).forEach((group) => {
                const mainItem = group[0]; // Adiciona apenas o Alimento Principal
                if (!mainItem) return;

                const baseAmt = parseFloat(mainItem.amount) || 0;
                if (baseAmt === 0) return;

                const amt = baseAmt * multiplier;

                let cleanName = mainItem.name.trim();
                const prefixRegex = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Záéíóúç]+)?\s*(de\s+)?/i;
                if (prefixRegex.test(cleanName)) cleanName = cleanName.replace(prefixRegex, '').trim();

                const key = `${cleanName.toLowerCase()}|${mainItem.unit}`;

                if (!list[key]) {
                    let cat = '🛒 Outros';
                    const n = cleanName.toLowerCase();
                    if (n.includes('frango') || n.includes('carne') || n.includes('peixe') || n.includes('ovo') || n.includes('queijo') || n.includes('leite') || n.includes('mussarela')) {
                        cat = '🥩 Açougue e Laticínios';
                    } else if (n.includes('arroz') || n.includes('aveia') || n.includes('pão') || n.includes('macarrão') || n.includes('azeite') || n.includes('tapioca') || n.includes('crepioca')) {
                        cat = '📦 Mercearia';
                    } else if (n.includes('banana') || n.includes('maçã') || n.includes('batata') || n.includes('morango') || n.includes('uva') || n.includes('abóbora') || n.includes('cenoura') || n.includes('brócolis')) {
                        cat = '🥦 Frutaria e Legumes';
                    } else if (n.includes('whey') || n.includes('creatina') || n.includes('albumina') || n.includes('soja') || n.includes('yopro')) {
                        cat = '💪 Suplementos';
                    }
                    list[key] = { name: cleanName, unit: mainItem.unit, amount: amt, category: cat };
                } else {
                    list[key].amount += amt;
                }
            });
        });

        // Agrupa por categoria e converte g para Kg / ml para L
        const grouped = {};
        Object.values(list).forEach(item => {
            let finalAmount = item.amount;
            let finalUnit = item.unit;
            if (finalUnit === 'g' && finalAmount >= 1000) {
                finalAmount = (finalAmount / 1000).toFixed(1).replace('.0', '');
                finalUnit = 'kg';
            } else if (finalUnit === 'ml' && finalAmount >= 1000) {
                finalAmount = (finalAmount / 1000).toFixed(1).replace('.0', '');
                finalUnit = 'L';
            }
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push({ ...item, amount: finalAmount, unit: finalUnit });
        });
        return grouped;
    }, [diet]);

    const toggleShoppingItem = (itemName) => {
        if (checkedShoppingItems.includes(itemName)) {
            setCheckedShoppingItems(checkedShoppingItems.filter(i => i !== itemName));
        } else {
            setCheckedShoppingItems([...checkedShoppingItems, itemName]);
        }
    };

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
                            <RoutineSelector theme={theme} types={availableTypes} activeType={activeDayType} onChange={setActiveDayType} />
                            
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUAS REFEIÇÕES</Text>
                            </View>

                            {visibleMeals.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="silverware-fork-knife" size={32} color={theme.textSecondary} />
                                    <Text style={[styles.emptyTitle, { color: theme.text }]}>Dia Livre</Text>
                                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Nenhuma refeição cadastrada pelo Coach para o dia de "{activeDayType}".</Text>
                                </View>
                            ) : (
                                visibleMeals.map((meal, index) => (
                                    <CleanMealCard 
                                        key={meal.id} 
                                        meal={meal} 
                                        theme={theme} 
                                        index={index} 
                                        isChecked={!!checkedMeals[meal.id]}
                                        onToggleCheck={toggleMealCheck}
                                    />
                                ))
                            )}
                        </>
                    ) : (
                        <>
                            <View style={styles.sectionHeader}>
                                <View style={[styles.greenStrip, { backgroundColor: theme.accent }]} />
                                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HIDRATAÇÃO</Text>
                            </View>

                            <WaterTracker 
                                theme={theme} 
                                studentId={user?.id} 
                                weight={user?.peso} 
                            />

                            <View style={styles.toolsGrid}>
                                <TouchableOpacity 
                                    style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                    onPress={() => setIsShoppingListOpen(true)}
                                >
                                    <MaterialCommunityIcons name="cart-outline" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <View>
                                        <Text style={[styles.toolTitle, { color: theme.text }]}>MERCADO</Text>
                                        <Text style={[styles.toolSub, { color: theme.textSecondary }]}>SUA LISTA</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Substitui o Biofeedback pelo Ajuste de Dieta */}
                                <TouchableOpacity 
                                    style={[styles.toolCard, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                                    onPress={() => setSurveyModalVisible(true)}
                                >
                                    <MaterialCommunityIcons name="pencil-outline" size={26} color={theme.accent} style={{marginBottom: 8}} />
                                    <View>
                                        <Text style={[styles.toolTitle, { color: theme.text }]}>AJUSTES</Text>
                                        <Text style={[styles.toolSub, { color: theme.textSecondary }]}>MUDAR PLANO</Text>
                                    </View>
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

                        </>
                    )}
                </Animated.ScrollView>
            </View>

            {/* 🔥 MODAIS IMPORTADOS */}
            <DietSurveyModal visible={surveyModalVisible} onClose={() => setSurveyModalVisible(false)} theme={theme} userId={user?.id} />
            <ShoppingListModal 
                visible={isShoppingListOpen} 
                onClose={() => setIsShoppingListOpen(false)} 
                theme={theme} 
                shoppingList={shoppingList}
                checkedShoppingItems={checkedShoppingItems}
                toggleShoppingItem={toggleShoppingItem}
            />
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

    daySelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, padding: 5, borderRadius: 20, borderWidth: 1, marginBottom: 25 },
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
    
    mainFoodCard: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 4 },
    cleanFoodName: { fontSize: 14, fontWeight: '900', fontStyle: 'italic', lineHeight: 20 },
    
    showSubsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4 },
    showSubsText: { fontSize: 11, fontWeight: '700' },
    subFoodCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 6 },
    subFoodName: { fontSize: 13, fontWeight: '600', flex: 1 },

    cleanNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 25, padding: 16, borderRadius: 16, borderWidth: 1, zIndex: 2 },
    cleanNoteText: { fontSize: 12, fontStyle: 'italic', lineHeight: 18 },

    toolsGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    toolCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 20, borderWidth: 1 },
    toolTitle: { fontSize: 13, fontWeight: '900' },
    toolSub: { fontSize: 9, fontWeight: 'bold', marginTop: 2 },

    infoCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    infoTitle: { fontSize: 14, fontWeight: '900' },
    infoDesc: { fontSize: 12, lineHeight: 18 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalBox: { borderRadius: 24, padding: 25, borderWidth: 1, position: 'relative', alignSelf: 'center' },
    modalClose: { position: 'absolute', top: 20, right: 20, padding: 5, zIndex: 10 },
    modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
    modalLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    modalOptionsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    modalOption: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    obsInput: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, height: 80, textAlignVertical: 'top', marginBottom: 20 },
    modalSubmit: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },

    emptyBox: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 24, marginTop: 10 },
    emptyTitle: { fontSize: 16, fontWeight: '900', marginTop: 10 },
    emptyDesc: { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});
