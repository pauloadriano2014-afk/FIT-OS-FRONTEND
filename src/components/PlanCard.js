import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const isWeb = Platform.OS === 'web';

const PERIOD_LABELS = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };

function getPeriodoPreco(card, periodo) {
    const raw = card?.precos?.[periodo];
    if (raw == null) return null;
    if (typeof raw === 'object') return { valor: raw.valor, descontoPerc: raw.descontoPerc || 0 };
    return { valor: raw, descontoPerc: 0 };
}

function formatBRL(value) {
    return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function PlanCard({ card, pulseAnim, onBuy }) {
    const periodosComPreco = Object.keys(PERIOD_LABELS).filter(p => getPeriodoPreco(card, p)?.valor);

    const cardContent = (
        <>
            {card.destaque && card.badgeTexto ? (
                <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>{card.badgeTexto}</Text>
                </View>
            ) : null}
            <Text style={[styles.planName, { color: card.destaque ? '#4DE38F' : '#FFF' }]}>{card.nome}</Text>
            <Text style={[styles.planDesc, card.destaque && { color: '#CCC' }]}>{card.descricao}</Text>

            <View style={styles.planItems}>
                {card.itensInclusos.map((item, i) => (
                    <View key={`inc-${i}`} style={styles.planItemRow}>
                        <MaterialCommunityIcons name="check-circle" size={16} color="#4DE38F" style={styles.planItemIcon} />
                        <Text style={[styles.planItemText, card.destaque && { color: '#FFF' }]}>{item}</Text>
                    </View>
                ))}
                {card.itensExcluidos.map((item, i) => (
                    <View key={`exc-${i}`} style={styles.planItemRow}>
                        <MaterialCommunityIcons name="close-circle-outline" size={16} color="#555" style={styles.planItemIcon} />
                        <Text style={[styles.planItemText, { color: '#666', textDecorationLine: 'line-through' }]}>{item}</Text>
                    </View>
                ))}
            </View>

            {card.itemDestaque ? (
                <View style={styles.itemDestaqueBox}>
                    <Text style={styles.itemDestaqueText}>{card.itemDestaque}</Text>
                </View>
            ) : null}

            {card.bonusTitulo ? (
                <View style={[styles.bonusSection, card.destaque && { borderColor: 'rgba(77, 227, 143, 0.25)', backgroundColor: 'rgba(77, 227, 143, 0.03)' }]}>
                    <Text style={[styles.bonusTitle, card.destaque && { color: '#4DE38F' }]}>{card.bonusTitulo}</Text>
                    {card.bonusItens.map((item, i) => (
                        <Text key={i} style={[styles.bonusItem, card.destaque && { color: '#DDD' }]}>• {item}</Text>
                    ))}
                </View>
            ) : null}

            <View style={styles.pricingGrid}>
                {periodosComPreco.map((periodo) => {
                    const p = getPeriodoPreco(card, periodo);
                    const hasDiscount = p.descontoPerc > 0;
                    const precoFinal = hasDiscount ? p.valor * (1 - p.descontoPerc / 100) : p.valor;
                    return (
                        <View key={periodo} style={styles.priceRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.pricePeriod, periodo === 'anual' && { color: card.destaque ? '#4DE38F' : '#FFF' }]}>
                                    {PERIOD_LABELS[periodo]}
                                </Text>
                                {hasDiscount ? (
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountBadgeText}>{p.descontoPerc}% OFF</Text>
                                    </View>
                                ) : null}
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                {hasDiscount ? (
                                    <Text style={styles.priceStriked}>De: R$ {formatBRL(p.valor)}</Text>
                                ) : null}
                                <Text style={[styles.priceValue, periodo === 'anual' && { color: card.destaque ? '#4DE38F' : '#FFF' }]}>
                                    R$ {formatBRL(precoFinal)}
                                </Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.urgencyText}>⏳ Depois que o tempo acabar, essa condição não volta.</Text>
        </>
    );

    if (card.destaque) {
        return (
            <Animated.View style={[styles.planCard, styles.planCardDestaque, { transform: [{ scale: pulseAnim }] }]}>
                {cardContent}
                <TouchableOpacity activeOpacity={0.8} onPress={() => onBuy(card.nome)}>
                    <LinearGradient colors={['#4DE38F', '#2bb368']} style={styles.buyBtnGradient}>
                        <Text style={[styles.buyBtnText, { color: '#000' }]}>{card.ctaTexto}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <View style={[styles.planCard, styles.planCardNormal]}>
            {cardContent}
            <TouchableOpacity activeOpacity={0.8} style={styles.buyBtnNormal} onPress={() => onBuy(card.nome)}>
                <Text style={[styles.buyBtnText, { color: '#FFF' }]}>{card.ctaTexto}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    planCard: {
        padding: 25,
        borderRadius: 24,
        position: 'relative',
        marginBottom: 10,
    },
    planCardNormal: {
        backgroundColor: '#111111',
        borderWidth: 1,
        borderColor: 'rgba(155, 93, 229, 0.2)', // Toque de roxo no card normal
    },
    planCardDestaque: {
        backgroundColor: '#161616',
        borderWidth: 2,
        borderColor: '#4DE38F',
        ...Platform.select({
            web: { boxShadow: '0px 0px 30px rgba(77, 227, 143, 0.15)' },
            default: { shadowColor: '#4DE38F', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }
        })
    },
    planName: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 5, textAlign: 'center' },
    planDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 22, marginTop: 6, marginBottom: 26, paddingHorizontal: 6 },
    planItems: { gap: 14, marginBottom: 20 },
    planItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    planItemIcon: { marginTop: 3 },
    planItemText: { flex: 1, fontSize: 14, color: '#AAA', fontWeight: '500', lineHeight: 21 },
    
    itemDestaqueBox: { 
        backgroundColor: 'rgba(77, 227, 143, 0.08)', 
        borderRadius: 12, 
        borderLeftWidth: 3, 
        borderLeftColor: '#4DE38F', 
        padding: 14, 
        marginBottom: 25 
    },
    itemDestaqueText: { color: '#4DE38F', fontSize: 13, fontWeight: 'bold', lineHeight: 20 },
    
    bonusSection: { backgroundColor: '#1A1A1A', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#333', marginBottom: 25 },
    bonusTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5, marginBottom: 10 },
    bonusItem: { fontSize: 12, color: '#888', marginBottom: 4, fontStyle: 'italic' },
    
    pricingGrid: { backgroundColor: '#0a0a0a', borderRadius: 16, padding: 15, marginBottom: 25, gap: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 8 },
    pricePeriod: { color: '#888', fontSize: 14, fontWeight: '600' },
    priceValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    
    discountBadge: { backgroundColor: 'rgba(155, 93, 229, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#9B5DE5' },
    discountBadgeText: { color: '#9B5DE5', fontSize: 9, fontWeight: '900' },
    priceStriked: { color: '#666', fontSize: 11, textDecorationLine: 'line-through', fontWeight: 'bold' },
    
    urgencyText: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, fontStyle: 'italic' },
    
    buyBtnNormal: { backgroundColor: '#1A1A1A', padding: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(155, 93, 229, 0.4)' },
    buyBtnGradient: { padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    buyBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
    
    recommendedBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#4DE38F', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 12 },
    recommendedText: { color: '#000', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
});