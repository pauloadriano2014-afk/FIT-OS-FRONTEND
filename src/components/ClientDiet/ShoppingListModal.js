// src/components/ClientDiet/ShoppingListModal.js — VERSÃO 2.0
// Filtro de período: DIÁRIO | SEMANAL | MENSAL
// Quantidades calculadas com base nos dias reais de cada tipo na semana
import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    ScrollView, Platform, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── PERÍODOS ─────────────────────────────────────────────────────────────────
const PERIODS = [
    { key: 'daily',   label: 'DIÁRIO',  icon: 'calendar-today'  },
    { key: 'weekly',  label: 'SEMANAL', icon: 'calendar-week'   },
    { key: 'monthly', label: 'MENSAL',  icon: 'calendar-month'  },
];

// ─── CÁLCULO DA LISTA POR PERÍODO ─────────────────────────────────────────────
/**
 * Recebe as refeições da dieta e o período desejado.
 * Retorna a lista agrupada por categoria com as quantidades corretas.
 *
 * Lógica:
 *   - Conta quantos dias de cada tipo existem na dieta (TREINO, TREINO_CARDIO, CARDIO, DESCANSO)
 *   - Semanal  → total de dias de cada tipo na semana
 *   - Diário   → média diária (total semanal / 7)
 *   - Mensal   → semanal × 4.3 (semanas médias no mês)
 */
function buildListForPeriod(meals = [], period = 'weekly') {
    if (!meals.length) return {};

    // Conta dias por tipo na semana (baseado nos tipos presentes na dieta)
    const typeCount = meals.reduce((acc, meal) => {
        const t = meal.dayType ?? 'TREINO';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    // Para cada tipo, quantos dias/semana representa
    // (considerando que a dieta tem exatamente 1 conjunto de refeições por tipo)
    // Se houver múltiplas refeições do mesmo tipo, normaliza dividindo pela contagem
    const uniqueTypes = Object.keys(typeCount);
    const mealsPerType = {};
    uniqueTypes.forEach(t => {
        mealsPerType[t] = meals.filter(m => (m.dayType ?? 'TREINO') === t);
    });

    // Distribuição semanal padrão por tipo
    // (usa a frequência da anamnese se disponível — fallback proporcional)
    const WEEKLY_DAYS = {
        TREINO:        2,
        TREINO_CARDIO: 2,
        CARDIO:        1,
        DESCANSO:      2,
    };

    // Fator de multiplicação por período
    const PERIOD_FACTOR = {
        daily:   1 / 7,   // média diária
        weekly:  1,        // base semanal
        monthly: 4.3,      // 4.3 semanas/mês
    };

    const factor = PERIOD_FACTOR[period] ?? 1;

    // Acumula quantidades
    const raw = {};

    uniqueTypes.forEach(dayType => {
        const daysInWeek = WEEKLY_DAYS[dayType] ?? 1;
        const weeklyMult = daysInWeek * factor;

        mealsPerType[dayType].forEach(meal => {
            const grouped = (meal.items ?? []).reduce((acc, item) => {
                const key = item.substitutionGroupId ?? item.groupId ?? item.id ?? Math.random().toString();
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
            }, {});

            Object.values(grouped).forEach(group => {
                const main = group[0];
                if (!main) return;

                const baseAmt = parseFloat(main.amount) || 0;
                if (baseAmt === 0) return;

                const totalAmt = baseAmt * weeklyMult;
                const itemKey  = `${main.name.trim().toLowerCase()}|${main.unit}`;

                // Categorização
                const n = (main.name ?? '').toLowerCase();
                let cat = '🛒 Outros';
                if (n.includes('frango') || n.includes('peito') || n.includes('carne') ||
                    n.includes('peixe')  || n.includes('atum')   || n.includes('tilápia') ||
                    n.includes('salmão') || n.includes('sardinha')|| n.includes('ovo') ||
                    n.includes('queijo') || n.includes('leite')   || n.includes('iogurte') ||
                    n.includes('cottage')|| n.includes('whey')    || n.includes('albumina'))
                    cat = '🥩 Açougue, Laticínios e Proteínas';
                else if (n.includes('arroz') || n.includes('aveia')   || n.includes('pão') ||
                         n.includes('tapioca')|| n.includes('macarrão')|| n.includes('batata') ||
                         n.includes('mandioca')|| n.includes('granola') || n.includes('feijão') ||
                         n.includes('lentilha')|| n.includes('grão')    || n.includes('cuscuz'))
                    cat = '🌾 Carboidratos e Grãos';
                else if (n.includes('banana') || n.includes('maçã')    || n.includes('mamão') ||
                         n.includes('morango') || n.includes('uva')     || n.includes('laranja') ||
                         n.includes('abacaxi') || n.includes('melancia')|| n.includes('kiwi') ||
                         n.includes('pera')    || n.includes('abacate'))
                    cat = '🍎 Frutas e Vegetais';
                else if (n.includes('alface') || n.includes('tomate')   || n.includes('brócolis') ||
                         n.includes('cenoura') || n.includes('abóbora')  || n.includes('espinafre') ||
                         n.includes('couve')   || n.includes('rúcula')   || n.includes('pepino'))
                    cat = '🍎 Frutas e Vegetais';
                else if (n.includes('azeite') || n.includes('pasta de amendoim') ||
                         n.includes('castanha')|| n.includes('nozes')    || n.includes('manteiga'))
                    cat = '🫙 Gorduras e Oleaginosas';
                else if (n.includes('creatina')|| n.includes('suplemento')|| n.includes('barra'))
                    cat = '💊 Suplementos';

                if (!raw[itemKey]) {
                    raw[itemKey] = { name: main.name.trim(), unit: main.unit, amount: totalAmt, category: cat };
                } else {
                    raw[itemKey].amount += totalAmt;
                }
            });
        });
    });

    // Formatar quantidades e agrupar por categoria
    const grouped = {};
    Object.values(raw).forEach(item => {
        let amt  = item.amount;
        let unit = item.unit;

        if (unit === 'g' && amt >= 1000) {
            amt  = parseFloat((amt / 1000).toFixed(2));
            unit = 'kg';
        } else if (unit === 'ml' && amt >= 1000) {
            amt  = parseFloat((amt / 1000).toFixed(2));
            unit = 'L';
        } else {
            // Arredonda para 1 casa decimal
            amt = Math.round(amt * 10) / 10;
        }

        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push({ ...item, amount: amt, unit });
    });

    // Ordena itens dentro de cada categoria por nome
    Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
    });

    return grouped;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function ShoppingListModal({
    visible, onClose, theme,
    meals,                    // 🔥 NOVO: recebe meals direto em vez de shoppingList pré-calculada
    shoppingList,             // mantido para retrocompatibilidade
    checkedShoppingItems,
    toggleShoppingItem,
}) {
    const [period, setPeriod] = useState('weekly');

    // Usa meals se disponível (novo), senão usa shoppingList (legado)
    const list = useMemo(() => {
        if (meals?.length) return buildListForPeriod(meals, period);
        // Retrocompatibilidade: shoppingList já calculada (sem filtro de período)
        return shoppingList ?? {};
    }, [meals, period, shoppingList]);

    const categories  = Object.keys(list);
    const totalItems  = categories.reduce((sum, cat) => sum + list[cat].length, 0);
    const doneItems   = checkedShoppingItems.length;

    const periodLabel = PERIODS.find(p => p.key === period)?.label ?? '';

    const handleDownloadPdf = () => {
        const msg = 'Sua Lista de Mercado em PDF será gerada em breve.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Em Breve', msg);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>

                    {/* ── HEADER ────────────────────────────────────────────── */}
                    <View style={[styles.header, { borderBottomColor: theme.accent }]}>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                        </TouchableOpacity>

                        <View style={styles.headerTop}>
                            <View style={styles.headerIconBox}>
                                <MaterialCommunityIcons name="cart-outline" size={28} color={theme.accent} />
                            </View>
                            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf}>
                                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.headerTitle}>LISTA DE COMPRAS</Text>
                        <Text style={[styles.headerSub, { color: theme.accent }]}>
                            {doneItems}/{totalItems} ITENS MARCADOS · {periodLabel}
                        </Text>

                        {/* ── FILTRO DE PERÍODO ──────────────────────────────── */}
                        <View style={[styles.periodRow, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
                            {PERIODS.map(p => {
                                const isActive = period === p.key;
                                return (
                                    <TouchableOpacity
                                        key={p.key}
                                        style={[
                                            styles.periodBtn,
                                            isActive && { backgroundColor: theme.accent },
                                        ]}
                                        onPress={() => setPeriod(p.key)}
                                    >
                                        <MaterialCommunityIcons
                                            name={p.icon}
                                            size={13}
                                            color={isActive ? '#000' : 'rgba(255,255,255,0.6)'}
                                        />
                                        <Text style={[
                                            styles.periodBtnText,
                                            { color: isActive ? '#000' : 'rgba(255,255,255,0.6)' },
                                        ]}>
                                            {p.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ── LISTA ─────────────────────────────────────────────── */}
                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={{ padding: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {categories.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <MaterialCommunityIcons name="cart-off" size={48} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 15 }} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                    SUA LISTA ESTÁ VAZIA
                                </Text>
                            </View>
                        ) : (
                            categories.map((cat, cIdx) => (
                                <View
                                    key={cIdx}
                                    style={[styles.catCard, { backgroundColor: theme.bg, borderColor: theme.border }]}
                                >
                                    {/* Cabeçalho da categoria */}
                                    <View style={[styles.catHeader, { borderBottomColor: theme.border }]}>
                                        <View style={[styles.catDot, { backgroundColor: theme.accent }]} />
                                        <Text style={[styles.catTitle, { color: theme.text }]}>{cat}</Text>
                                        <Text style={[styles.catCount, { color: theme.textSecondary }]}>
                                            {list[cat].length} {list[cat].length === 1 ? 'item' : 'itens'}
                                        </Text>
                                    </View>

                                    {/* Itens */}
                                    <View style={styles.itemList}>
                                        {list[cat].map((item, iIdx) => {
                                            const checked = checkedShoppingItems.includes(item.name);
                                            return (
                                                <TouchableOpacity
                                                    key={iIdx}
                                                    style={[
                                                        styles.itemRow,
                                                        {
                                                            borderColor:     theme.border,
                                                            backgroundColor: theme.surface,
                                                        },
                                                        checked && {
                                                            backgroundColor: theme.bg,
                                                            borderColor:     'transparent',
                                                            opacity:         0.45,
                                                        },
                                                    ]}
                                                    onPress={() => toggleShoppingItem(item.name)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={styles.itemLeft}>
                                                        <MaterialCommunityIcons
                                                            name={checked ? 'checkbox-marked' : 'square-outline'}
                                                            size={20}
                                                            color={checked ? theme.accent : theme.textSecondary}
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.itemName,
                                                                { color: checked ? theme.textSecondary : theme.text },
                                                                checked && { textDecorationLine: 'line-through' },
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {item.name}
                                                        </Text>
                                                    </View>

                                                    <View style={[styles.itemAmt, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                                        <Text style={[styles.itemAmtNum, { color: theme.text }]}>
                                                            {item.amount}
                                                        </Text>
                                                        <Text style={[styles.itemAmtUnit, { color: theme.accent }]}>
                                                            {item.unit}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))
                        )}

                        {/* Nota explicativa do período */}
                        {categories.length > 0 && (
                            <View style={[styles.noteBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="information-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                                    {period === 'daily'  && 'Quantidade média por dia, considerando a distribuição semanal da sua dieta.'}
                                    {period === 'weekly' && 'Quantidade total para uma semana completa (7 dias conforme o seu plano).'}
                                    {period === 'monthly'&& 'Quantidade total para um mês (4 semanas). Ideal para compras em atacado.'}
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* ── RODAPÉ ────────────────────────────────────────────── */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity
                            style={[styles.doneBtn, { backgroundColor: '#0F172A' }]}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons name="check-bold" size={18} color="#FFF" />
                            <Text style={styles.doneBtnText}>CONCLUIR COMPRA</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    box: {
        width: '100%', maxWidth: 500,
        borderRadius: 32, borderWidth: 1,
        overflow: 'hidden', maxHeight: '88%',
    },

    // Header
    header: {
        backgroundColor: '#0F172A',
        padding: 24,
        borderBottomWidth: 4,
        position: 'relative',
    },
    closeBtn: {
        position: 'absolute', top: 20, right: 20, zIndex: 10,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTop: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16, paddingRight: 50,
    },
    headerIconBox: {
        width: 56, height: 56, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', justifyContent: 'center',
    },
    pdfBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFF', fontSize: 24,
        fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 4, marginBottom: 16,
    },

    // Filtro de período
    periodRow: {
        flexDirection: 'row', borderRadius: 14,
        padding: 4, gap: 4,
    },
    periodBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 5,
        paddingVertical: 10, borderRadius: 10,
    },
    periodBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

    // Scroll
    scroll: { flexShrink: 1 },

    // Vazio
    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },

    // Categorias
    catCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
    catHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1,
    },
    catDot:   { width: 6, height: 6, borderRadius: 3 },
    catTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, flex: 1 },
    catCount: { fontSize: 10, fontWeight: '700' },

    // Itens
    itemList: { gap: 10 },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1,
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
    itemName: { fontSize: 13, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', flexShrink: 1 },
    itemAmt: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1,
    },
    itemAmtNum:  { fontSize: 16, fontWeight: '900' },
    itemAmtUnit: { fontSize: 9,  fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 },

    // Nota
    noteBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 4,
    },
    noteText: { fontSize: 11, lineHeight: 16, flex: 1, fontStyle: 'italic' },

    // Footer
    footer: { padding: 20, borderTopWidth: 1, backgroundColor: '#FFF' },
    doneBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 18, borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    },
    doneBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
});