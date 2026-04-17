// src/components/ClientDiet/ShoppingListModal.js
import React from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ShoppingListModal({ 
    visible, onClose, theme, shoppingList, 
    checkedShoppingItems, toggleShoppingItem 
}) {
    // Extrai as categorias para iterar (ex: '🥩 Açougue', '📦 Mercearia')
    const categories = Object.keys(shoppingList || {});

    const handleDownloadPdf = () => {
        if(Platform.OS === 'web') window.alert('Sua Lista de Mercado em PDF será gerada em breve.');
        else Alert.alert('Em Breve', 'Sua Lista de Mercado em PDF estará disponível na próxima atualização.');
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    {/* 🔥 HEADER ELITE (Dark View) */}
                    <View style={[styles.eliteHeader, { borderBottomColor: theme.accent }]}>
                        <TouchableOpacity style={styles.closeBtnElite} onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={20} color="#FFF" />
                        </TouchableOpacity>
                        
                        <View style={styles.headerTopRow}>
                            <View style={[styles.headerIconBox, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                                <MaterialCommunityIcons name="cart-outline" size={28} color={theme.accent} />
                            </View>
                            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPdf}>
                                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.eliteTitle} numberOfLines={1}>MINHA LISTA DE COMPRAS</Text>
                        <Text style={[styles.eliteSub, { color: theme.accent }]}>CALCULADO DE TODOS OS DIAS</Text>
                    </View>

                    {/* 🔥 CORPO DA LISTA DE MERCADO */}
                    <ScrollView style={styles.scrollBody} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                        {categories.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <MaterialCommunityIcons name="cart-off" size={48} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 15 }} />
                                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>SUA LISTA ESTÁ VAZIA</Text>
                            </View>
                        ) : (
                            categories.map((category, cIdx) => (
                                <View key={cIdx} style={[styles.categoryCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                    
                                    {/* Cabeçalho da Categoria */}
                                    <View style={[styles.categoryHeader, { borderBottomColor: theme.border }]}>
                                        <View style={[styles.pulseDot, { backgroundColor: theme.accent }]} />
                                        <Text style={[styles.categoryTitle, { color: theme.text }]} numberOfLines={1}>{category}</Text>
                                    </View>
                                    
                                    {/* Lista de Itens */}
                                    <View style={styles.itemsContainer}>
                                        {shoppingList[category].map((item, iIdx) => {
                                            const isChecked = checkedShoppingItems.includes(item.name);
                                            return (
                                                <TouchableOpacity 
                                                    key={iIdx}
                                                    style={[
                                                        styles.itemRow, 
                                                        { borderColor: theme.border, backgroundColor: theme.surface },
                                                        // Efeito visual quando o aluno marca como comprado:
                                                        isChecked && { backgroundColor: theme.bg, borderColor: 'transparent', opacity: 0.5 }
                                                    ]}
                                                    onPress={() => toggleShoppingItem(item.name)}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={styles.itemLeft}>
                                                        <MaterialCommunityIcons 
                                                            name={isChecked ? "checkbox-marked" : "square-outline"} 
                                                            size={20} 
                                                            color={isChecked ? theme.accent : theme.textSecondary} 
                                                        />
                                                        <Text style={[
                                                            styles.itemName, 
                                                            { color: isChecked ? theme.textSecondary : theme.text },
                                                            isChecked && { textDecorationLine: 'line-through' }
                                                        ]} numberOfLines={1}>
                                                            {item.name}
                                                        </Text>
                                                    </View>
                                                    
                                                    <View style={[styles.itemRight, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                                        <Text style={[styles.itemAmount, { color: theme.text }]}>{item.amount}</Text>
                                                        <Text style={[styles.itemUnit, { color: theme.accent }]}>{item.unit}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>

                    {/* 🔥 RODAPÉ: BOTÃO CONCLUIR */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#0F172A' }]} onPress={onClose} activeOpacity={0.8}>
                            <Text style={styles.submitText}>CONCLUIR COMPRA</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalBox: { width: '100%', maxWidth: 500, borderRadius: 32, borderWidth: 1, overflow: 'hidden', maxHeight: '85%' },
    
    eliteHeader: { backgroundColor: '#0F172A', padding: 24, borderBottomWidth: 4, position: 'relative' },
    closeBtnElite: { position: 'absolute', top: 20, right: 20, width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingRight: 50 },
    headerIconBox: { width: 56, height: 56, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    pdfBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    
    eliteTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
    eliteSub: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 4 },

    scrollBody: { flexShrink: 1 },

    emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },

    categoryCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 20 },
    categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1 },
    pulseDot: { width: 6, height: 6, borderRadius: 3 },
    categoryTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

    itemsContainer: { gap: 10 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1 },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
    itemName: { fontSize: 13, fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', flexShrink: 1 },
    
    itemRight: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    itemAmount: { fontSize: 16, fontWeight: '900' },
    itemUnit: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', marginLeft: 4 },

    footer: { padding: 20, borderTopWidth: 1, backgroundColor: '#FFF' },
    submitBtn: { paddingVertical: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    submitText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
});