// src/components/Admin/AdminSurveyCard.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, UIManager, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Ativa a animação fluida no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AdminSurveyCard({ item, theme, onMarkRead }) {
    const isRead = item.readByAdmin;
    // O card começa fechado (false). Se quiser que os não lidos comecem abertos, mude para: useState(!isRead)
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const renderBadge = (value) => {
        if (!value) return null;
        let color = '#FFCC00'; 
        let icon = 'minus-circle';
        
        const goodValues = ['EXCELENTE', '100%', 'OTIMO', 'PERFEITO', 'MUITO'];
        const badValues = ['RUIM', 'DIFICIL', 'CONFUSO', 'FALTA_ALGO', 'NUNCA', 'DIFICULDADE'];

        if (goodValues.includes(value)) { color = '#4DE38F'; icon = 'check-circle'; }
        else if (badValues.includes(value)) { color = '#FF3B30'; icon = 'alert-circle'; }

        return (
            <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color }]}>
                <MaterialCommunityIcons name={icon} size={12} color={color} />
                <Text style={[styles.badgeText, { color: color }]}>{value}</Text>
            </View>
        );
    };

    const renderQuote = (text, isAlert = false) => {
        if (!text) return null;
        return (
            <View style={[styles.quoteBox, { backgroundColor: isAlert ? '#FF3B3010' : theme.bg, borderColor: isAlert ? '#FF3B3044' : theme.border }]}>
                <MaterialCommunityIcons name="format-quote-open" size={16} color={isAlert ? '#FF3B30' : theme.textSecondary} style={{marginRight: 6, marginTop: -2}} />
                <Text style={[styles.quoteText, { color: isAlert ? '#FF3B30' : theme.text }]}>{text}</Text>
            </View>
        );
    };

    const SectionHeader = ({ title, icon, color }) => (
        <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name={icon} size={18} color={color || theme.textSecondary} />
            <Text style={[styles.sectionTitle, { color: color || theme.textSecondary }]}>{title}</Text>
        </View>
    );

    return (
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: isRead ? theme.border : theme.accent, opacity: isRead ? 0.7 : 1 }]}>
            
            {/* CABEÇALHO CLICÁVEL (ACORDEÃO) */}
            <TouchableOpacity style={[styles.header, { borderBottomWidth: isExpanded ? 1 : 0, borderBottomColor: theme.border }]} onPress={toggleExpand} activeOpacity={0.7}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1}}>
                    <View style={[styles.iconBox, { backgroundColor: isRead ? theme.bg : theme.accent + '22' }]}>
                        <MaterialCommunityIcons name={isRead ? "check-all" : "star-face"} size={22} color={isRead ? theme.textSecondary : theme.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{item.user?.name || "Aluno"}</Text>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('pt-BR')} às {new Date(item.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    {!isRead && (
                        <TouchableOpacity 
                            onPress={(e) => { e.stopPropagation(); onMarkRead(item.id); setIsExpanded(false); }} 
                            style={[styles.readBtn, { backgroundColor: theme.accent }]}
                        >
                            <MaterialCommunityIcons name="check-bold" size={14} color="#000" />
                            <Text style={{color: '#000', fontSize: 10, fontWeight: '900', marginLeft: 4}}>LIDO</Text>
                        </TouchableOpacity>
                    )}
                    <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
                </View>
            </TouchableOpacity>

            {/* CORPO DO FEEDBACK (SÓ APARECE SE CLICAR) */}
            {isExpanded && (
                <View style={styles.body}>
                    
                    {/* BLOCO 1: APP E VISUAL */}
                    <View style={[styles.block, { borderColor: theme.border }]}>
                        <SectionHeader title="USABILIDADE E VISUAL" icon="cellphone" />
                        <View style={styles.row}>
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>USABILIDADE (APP)</Text>
                                {renderBadge(item.appExperience)}
                            </View>
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>DESIGN / CORES</Text>
                                {renderBadge(item.visualExperience)}
                            </View>
                        </View>
                        {renderQuote(item.appExpReason, true)}
                        {item.visualReason && renderQuote(`Cor sugerida: ${item.visualReason}`, true)}
                    </View>

                    {/* BLOCO 2: FERRAMENTAS E CHECKIN */}
                    <View style={[styles.block, { borderColor: theme.border }]}>
                        <SectionHeader title="FERRAMENTAS E AVALIAÇÕES" icon="robot-outline" />
                        <View style={styles.row}>
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>FERRAMENTAS (IA/RM)</Text>
                                {renderBadge(item.toolsExperience)}
                            </View>
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>CHECK-IN / LAUDOS</Text>
                                {renderBadge(item.checkinExperience)}
                            </View>
                        </View>
                        <View style={[styles.row, { marginTop: 12 }]}>
                            <View style={styles.metric}>
                                <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>BIBLIOTECA (PA FLIX)</Text>
                                {renderBadge(item.libraryExperience)}
                            </View>
                        </View>
                        {renderQuote(item.toolsReason, true)}
                        {renderQuote(item.checkinReason, true)}
                    </View>

                    {/* BLOCO 3: FEEDBACKS ABERTOS */}
                    {(item.appImprovement || item.coachSupport) && (
                        <View style={[styles.block, { borderColor: theme.border, borderBottomWidth: (item.dietRoutine || item.dietTools || item.dietExperience) ? 1 : 0 }]}>
                            <SectionHeader title="FEEDBACKS E SUGESTÕES" icon="comment-text-outline" />
                            {item.appImprovement && (
                                <View style={{marginBottom: 10}}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary, marginBottom: 4 }]}>MELHORIAS NO APLICATIVO:</Text>
                                    {renderQuote(item.appImprovement)}
                                </View>
                            )}
                            {item.coachSupport && (
                                <View>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary, marginBottom: 4 }]}>SOBRE O ACOMPANHAMENTO DO COACH:</Text>
                                    {renderQuote(item.coachSupport)}
                                </View>
                            )}
                        </View>
                    )}

                    {/* BLOCO 4: DIETA ELITE */}
                    {(item.dietRoutine || item.dietTools || item.dietSubstitutions || item.dietExperience) && (
                        <View style={[styles.block, { borderColor: '#4DE38F55', backgroundColor: '#4DE38F08', borderBottomWidth: 0, marginTop: 10, padding: 15, borderRadius: 12 }]}>
                            <SectionHeader title="MÓDULO DE DIETA (ELITE)" icon="food-apple" color="#4DE38F" />
                            
                            <View style={styles.row}>
                                <View style={styles.metric}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>DIVISÃO DA ROTINA</Text>
                                    {renderBadge(item.dietRoutine)}
                                </View>
                                <View style={styles.metric}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>ADESÃO À DIETA</Text>
                                    {renderBadge(item.dietAdherence)}
                                </View>
                            </View>
                            
                            <View style={[styles.row, {marginTop: 12}]}>
                                <View style={styles.metric}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>ÁGUA E MERCADO</Text>
                                    {renderBadge(item.dietTools)}
                                </View>
                                <View style={styles.metric}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>SUBSTITUIÇÕES</Text>
                                    {renderBadge(item.dietSubstitutions)}
                                </View>
                            </View>

                            {renderQuote(item.dietToolsReason, true)}
                            
                            {item.dietExperience && (
                                <View style={{marginTop: 15}}>
                                    <Text style={[styles.metricLabel, { color: theme.textSecondary, marginBottom: 4 }]}>COMENTÁRIO DO ALUNO (ROTINA/DIFICULDADES):</Text>
                                    {renderQuote(item.dietExperience)}
                                </View>
                            )}
                        </View>
                    )}

                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderRadius: 16, marginBottom: 15, borderWidth: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    userName: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    date: { color: '#888', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
    readBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
    
    body: { padding: 15, paddingTop: 5 },
    block: { paddingVertical: 15, borderBottomWidth: 1 },
    
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    
    row: { flexDirection: 'row', gap: 10 },
    metric: { flex: 1 },
    metricLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontWeight: 'bold' },
    
    quoteBox: { flexDirection: 'row', marginTop: 10, padding: 12, borderRadius: 8, borderWidth: 1 },
    quoteText: { fontSize: 13, fontStyle: 'italic', flex: 1, lineHeight: 20 }
});