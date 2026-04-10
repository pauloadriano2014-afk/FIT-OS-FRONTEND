// src/components/DietGuideModal.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// 🥗 1. EMAGRECIMENTO / DEFINIÇÃO (1200 - 1500 kcal)
const DIET_WEIGHT_LOSS = {
    title: "SUGESTÃO ALIMENTAR: DEFINIÇÃO 📉",
    instructions: [
        "A constância é o que separa o resultado da frustração. Siga o plano 100%.",
        "A ingestão proteica é sagrada para manter sua massa magra enquanto secamos.",
        "Beba no mínimo 3L a 4L de água por dia. Metabolismo hidratado queima mais.",
        "Use as opções de troca apenas se necessário para não enjoar do plano.",
        "O foco aqui é o déficit calórico estratégico para perda de 3 a 5kg."
    ],
    trainingDays: [
        { time: "PRÉ-TREINO (ENERGIA)", base: "70g Banana + 30g Whey Protein + 50g Iogurte Grego + 20g Aveia.", subs: "Trocas: Mamão (146g), Morango (201g) ou Abacaxi (124g)." },
        { time: "PÓS-TREINO (RECUPERAÇÃO)", base: "2 Ovos Inteiros + 2 Fatias de Pão Integral.", subs: "Trocas: Carne Moída/Patinho (45g) ou Frango Desfiado (40g)." },
        { time: "ALMOÇO (SACIEDADE)", base: "70g Arroz Branco + 50g Feijão + 120g Frango Grelhado + 150g Abobrinha.", subs: "Trocas: Macarrão (65g), Batata Inglesa (200g) ou Patinho (133g)." },
        { time: "LANCHE DA TARDE", base: "Crepioca (40g Tapioca + 1 Ovo) + 80g Frango Desfiado.", subs: "Trocas: Patinho (89g) ou Omelete (2 ovos)." },
        { time: "JANTAR (LIMPO)", base: "70g Arroz Branco + 120g Frango Grelhado + 150g Abobrinha.", subs: "Trocas: Vegetais Verdes (Brócolis/Couve) à vontade." }
    ],
    cardioDays: [
        { time: "CAFÉ DA MANHÃ", base: "1 Pão Francês + 3 Ovos Inteiros + 1 Colher de Requeijão Light.", subs: "Trocas: Pão Integral (2 fatias) ou Cream Cheese Light (23g)." },
        { time: "ALMOÇO", base: "100g Macarrão Cozido + 120g Carne Moída (Patinho) + 100g Brócolis.", subs: "Trocas: Mandioca (70g) ou Frango Grelhado (108g)." },
        { time: "LANCHE DA TARDE", base: "60g Tapioca + 70g Frango Desfiado.", subs: "Trocas: Ovos Cozidos (3 unidades)." },
        { time: "JANTAR", base: "100g Arroz Integral + 50g Feijão + 100g Carne Moída + 100g Abobrinha.", subs: "Trocas: Beterraba ou Couve-Flor (100g)." }
    ]
};

// 🥩 2. HIPERTROFIA MASCULINA (2000 - 2500 kcal)
const DIET_HYPERTROPHY_M = {
    title: "SUGESTÃO ALIMENTAR: VOLUME 💪 (HOMENS)",
    instructions: [
        "Para construir músculos, você precisa comer MAIS do que gasta. O superávit é lei.",
        "O carboidrato alto é seu combustível. Não tenha medo dele, ele vai te dar força no treino.",
        "A ingestão proteica repara as microlesões. Bata a meta diária sem errar.",
        "Beba no mínimo 4L de água por dia. Músculo é feito de água.",
        "Treine pesado. A comida só vira músculo se houver estímulo de hipertrofia (progressão de carga)."
    ],
    trainingDays: [
        { time: "PRÉ-TREINO (COMBUSTÍVEL)", base: "100g Banana + 40g Aveia + 30g Whey Protein + 15g Pasta de Amendoim.", subs: "Trocas: 2 Fatias de Pão Integral + Doce de Leite + Dose de Whey." },
        { time: "PÓS-TREINO (CONSTRUÇÃO)", base: "3 Ovos Inteiros + 1 Clara + 3 Fatias de Pão Integral.", subs: "Trocas: 150g Arroz Branco + 100g Frango Desfiado." },
        { time: "ALMOÇO (PEDREIRO)", base: "200g Arroz Branco + 100g Feijão + 150g Frango Grelhado ou Patinho + Salada livre.", subs: "Trocas: 300g Macarrão + 150g Carne Moída." },
        { time: "LANCHE DA TARDE", base: "80g Tapioca + 2 Ovos + 80g Frango Desfiado.", subs: "Trocas: Shake (40g Whey + 60g Aveia + 1 Banana média)." },
        { time: "JANTAR (RECUPERAÇÃO)", base: "200g Arroz Branco + 150g Frango Grelhado ou Carne + Vegetais.", subs: "Trocas: 300g Batata Inglesa + 150g Tilápia." }
    ],
    cardioDays: [
        { time: "CAFÉ DA MANHÃ", base: "2 Pães Franceses + 4 Ovos Inteiros.", subs: "Trocas: 100g Tapioca + 4 Ovos." },
        { time: "ALMOÇO", base: "150g Arroz Branco + 100g Feijão + 150g Frango/Carne + Vegetais.", subs: "Trocas: 200g Macarrão + 150g Patinho." },
        { time: "LANCHE DA TARDE", base: "200g Iogurte Natural + 40g Aveia + 1 Fruta.", subs: "Trocas: 2 Fatias de Pão + 3 Ovos." },
        { time: "JANTAR", base: "150g Arroz Branco + 150g Frango Grelhado + Salada.", subs: "Trocas: 200g Mandioca + 150g Carne Moída." }
    ]
};

// 🍑 3. HIPERTROFIA FEMININA (1500 - 2000 kcal)
const DIET_HYPERTROPHY_F = {
    title: "SUGESTÃO ALIMENTAR: VOLUME 🍑 (MULHERES)",
    instructions: [
        "Para crescer perna e glúteo, você precisa de energia. Não zere o carbo!",
        "O carboidrato limpo te dará força para agachar pesado. Confie no processo.",
        "Mantenha a proteína alta para recuperar a musculatura após os treinos.",
        "Beba no mínimo 3L de água por dia. Essencial para o volume muscular e pele.",
        "Evite trocar os alimentos base por opções sujas. O volume precisa ser limpo."
    ],
    trainingDays: [
        { time: "PRÉ-TREINO (COMBUSTÍVEL)", base: "70g Banana + 30g Aveia + 30g Whey Protein.", subs: "Trocas: 2 Fatias de Pão Integral + Geleia 100% Fruta." },
        { time: "PÓS-TREINO (CONSTRUÇÃO)", base: "2 Ovos Inteiros + 1 Clara + 2 Fatias de Pão Integral.", subs: "Trocas: 100g Arroz Branco + 80g Frango Desfiado." },
        { time: "ALMOÇO (VOLUME LIMPO)", base: "150g Arroz Branco + 70g Feijão + 120g Frango Grelhado ou Patinho + Salada livre.", subs: "Trocas: 200g Macarrão + 120g Carne Moída." },
        { time: "LANCHE DA TARDE", base: "50g Tapioca + 1 Ovo + 60g Frango Desfiado.", subs: "Trocas: 150g Iogurte Grego + 30g Aveia + Morangos." },
        { time: "JANTAR (RECUPERAÇÃO)", base: "150g Arroz Branco + 120g Frango Grelhado ou Carne + Vegetais.", subs: "Trocas: 200g Batata Inglesa + 120g Tilápia." }
    ],
    cardioDays: [
        { time: "CAFÉ DA MANHÃ", base: "1 Pão Francês + 2 Ovos Inteiros + 1 Clara.", subs: "Trocas: 60g Tapioca + 3 Ovos." },
        { time: "ALMOÇO", base: "100g Arroz Branco + 70g Feijão + 120g Frango/Carne + Vegetais.", subs: "Trocas: 150g Macarrão + 120g Patinho." },
        { time: "LANCHE DA TARDE", base: "150g Iogurte Natural + 20g Aveia + 1 Fruta.", subs: "Trocas: 1 Fatia de Pão + 2 Ovos." },
        { time: "JANTAR", base: "100g Arroz Branco + 120g Frango Grelhado + Salada.", subs: "Trocas: 150g Mandioca + 120g Carne Moída." }
    ]
};

export default function DietGuideModal({ visible, onClose, theme, dietGoal }) {
    if (!visible) return null;

    // 🔥 O componente decide qual dieta mostrar baseado no parâmetro que recebe
    let currentDiet = DIET_WEIGHT_LOSS;
    if (dietGoal === 'HYPERTROPHY_M') currentDiet = DIET_HYPERTROPHY_M;
    else if (dietGoal === 'HYPERTROPHY_F') currentDiet = DIET_HYPERTROPHY_F;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={[styles.dietCard, { backgroundColor: theme.bg }]}>
                    <View style={[styles.dietHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.dietTitle, { color: theme.text }]}>{currentDiet.title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={{padding: 20}} showsVerticalScrollIndicator={false}>
                        <View style={[styles.instructionBox, { backgroundColor: theme.accent + '15', borderColor: theme.accent }]}>
                            <Text style={[styles.dietSectionTitle, { color: theme.accent, marginBottom: 10 }]}>REGRAS DO COACH 👊</Text>
                            {currentDiet.instructions.map((text, i) => (
                                <View key={i} style={styles.instructionRow}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={16} color={theme.accent} />
                                    <Text style={[styles.instructionText, {color: theme.text}]}>{text}</Text>
                                </View>
                            ))}
                        </View>

                        <Text style={[styles.dietSectionTitle, {color: theme.text, marginTop: 20}]}>DIAS DE MUSCULAÇÃO 💪</Text>
                        {currentDiet.trainingDays.map((meal, i) => (
                            <View key={i} style={[styles.mealCard, {backgroundColor: theme.surface, borderColor: theme.border}]}>
                                <Text style={[styles.mealTime, {color: theme.accent}]}>{meal.time}</Text>
                                <Text style={[styles.mealDesc, {color: theme.text}]}>{meal.base}</Text>
                                <Text style={[styles.mealSubs, {color: theme.textSecondary}]}>{meal.subs}</Text>
                            </View>
                        ))}

                        <Text style={[styles.dietSectionTitle, {color: theme.text, marginTop: 25}]}>DIAS DE CARDIO (SEM MUSCULAÇÃO) 🏃‍♂️</Text>
                        {currentDiet.cardioDays.map((meal, i) => (
                            <View key={i} style={[styles.mealCard, {backgroundColor: theme.surface, borderColor: theme.border}]}>
                                <Text style={[styles.mealTime, {color: theme.accent}]}>{meal.time}</Text>
                                <Text style={[styles.mealDesc, {color: theme.text}]}>{meal.base}</Text>
                                <Text style={[styles.mealSubs, {color: theme.textSecondary}]}>{meal.subs}</Text>
                            </View>
                        ))}
                        
                        <View style={{height: 100}} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
    dietCard: { flex: 1, marginTop: 60, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
    dietHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25, borderBottomWidth: 1 },
    dietTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    dietSectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15, letterSpacing: 1, textDecorationLine: 'underline' },
    instructionBox: { padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed' },
    instructionRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
    instructionText: { fontSize: 13, flex: 1, fontWeight: '600' },
    mealCard: { padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
    mealTime: { fontSize: 13, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    mealDesc: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
    mealSubs: { fontSize: 12, fontStyle: 'italic', marginTop: 10, opacity: 0.8 }
});