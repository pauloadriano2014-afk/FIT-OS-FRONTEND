// src/components/AdminDiet/PdfNotesModal.js
import React, { useState } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SECTIONS = [
    {
        key: 'restricoes',
        icon: 'alert-circle-outline',
        color: '#FF6B6B',
        title: 'Restrições Alimentares',
        items: [
            {
                key: 'gluten',
                icon: '🌾',
                label: 'Evitar Glúten',
                desc: 'Aparece no PDF: alerta para evitar trigo, aveia, centeio e cevada. Ideal para alunos com sensibilidade ou doença celíaca.',
                text: '⚠️ Evite todos os alimentos com glúten: trigo, aveia, centeio e cevada.',
            },
            {
                key: 'lactose',
                icon: '🥛',
                label: 'Evitar Lactose',
                desc: 'Aparece no PDF: orienta o aluno a escolher versões sem lactose de leite, iogurte e queijo.',
                text: '⚠️ Prefira versões sem lactose de leite, iogurte e queijo.',
            },
            {
                key: 'fodmap',
                icon: '🥦',
                label: 'Protocolo Low FODMAP',
                desc: 'Aparece no PDF: instrução para evitar alimentos fermentáveis (alho, cebola, leguminosas). Indicado para alunos com SIBO ou IBS.',
                text: '⚠️ Siga o protocolo Low FODMAP: evite alho, cebola, leguminosas e frutas de alto FODMAP.',
            },
            {
                key: 'acucar',
                icon: '🍬',
                label: 'Sem Açúcar Refinado',
                desc: 'Aparece no PDF: proíbe açúcar refinado e sugere alternativas naturais como stevia e eritritol.',
                text: '⚠️ Elimine o açúcar refinado. Use adoçantes naturais como stevia ou eritritol.',
            },
            {
                key: 'alcool',
                icon: '🍺',
                label: 'Sem Álcool',
                desc: 'Aparece no PDF: lembra que álcool paralisa a queima de gordura e instrui a evitá-lo totalmente nesta fase.',
                text: '⚠️ Álcool é caloria vazia e paralisa a queima de gordura. Evite totalmente nesta fase.',
            },
        ],
    },
    {
        key: 'estrategias',
        icon: 'lightning-bolt',
        color: '#FFD700',
        title: 'Estratégias e Protocolos',
        items: [
            {
                key: 'pesar',
                icon: '⚖️',
                label: 'Pesar Alimentos Crus',
                desc: 'Aparece no PDF: orienta o aluno a sempre pesar os alimentos crus e sem osso para garantir precisão calórica.',
                text: '📏 Pese os alimentos sempre crus e sem osso para maior precisão calórica.',
            },
            {
                key: 'agua',
                icon: '💧',
                label: 'Água Longe das Refeições',
                desc: 'Aparece no PDF: instrução para beber água 30 minutos antes ou depois das refeições. Importante para alunos com SIBO ou problemas digestivos.',
                text: '💧 Beba água 30 minutos antes ou 30 minutos após as refeições. Nunca durante.',
            },
            {
                key: 'horarios',
                icon: '🕐',
                label: 'Respeitar Horários',
                desc: 'Aparece no PDF: lembra que os horários são referência e que o intervalo de ~3 horas entre refeições é o mais importante.',
                text: '🕐 Os horários são uma base. Mantenha intervalos de ~3 horas entre as refeições.',
            },
            {
                key: 'mastigar',
                icon: '🦷',
                label: 'Mastigar Devagar',
                desc: 'Aparece no PDF: recomenda mastigar ao menos 20 vezes por garfada para melhorar digestão e saciedade.',
                text: '🦷 Mastigue cada garfada ao menos 20 vezes. Isso melhora a digestão e a saciedade.',
            },
            {
                key: 'sono',
                icon: '😴',
                label: 'Priorizar o Sono',
                desc: 'Aparece no PDF: reforça que dormir ao menos 7 horas é essencial para recuperação e resultados.',
                text: '😴 Durma ao menos 7 horas por noite. O sono é fundamental para a recuperação muscular.',
            },
        ],
    },
    {
        key: 'suplementos',
        icon: 'flask-outline',
        color: '#00C851',
        title: 'Suplementação',
        items: [
            {
                key: 'whey',
                icon: '💪',
                label: 'Whey Liberado',
                desc: 'Aparece no PDF: confirma que o aluno pode usar whey protein (1 dose no pós-treino) conforme a prescrição da dieta.',
                text: '✅ Whey Protein liberado: use 1 dose no pós-treino ou conforme prescrito na dieta.',
            },
            {
                key: 'nowhey',
                icon: '🚫',
                label: 'Sem Whey Prescrito',
                desc: 'Aparece no PDF: informa que o whey não está no plano e que o aluno deve buscar proteína por alimentos naturais.',
                text: '❌ Whey não está prescrito neste plano. Substitua por alimentos proteicos naturais.',
            },
            {
                key: 'creatina',
                icon: '⚡',
                label: 'Creatina Prescrita',
                desc: 'Aparece no PDF: instrui o aluno a tomar 3-5g de creatina por dia, de preferência no pós-treino.',
                text: '⚡ Creatina: 3-5g/dia. Pode ser tomada a qualquer horário, de preferência pós-treino.',
            },
            {
                key: 'isolado',
                icon: '🧬',
                label: 'Apenas Whey Isolado',
                desc: 'Aparece no PDF: alerta para usar exclusivamente whey isolado (sem lactose e sem xilitol). Essencial para alunos com SIBO ou intolerância.',
                text: '⚠️ Use apenas Whey Isolado (sem lactose e sem xilitol). Verifique o rótulo antes de comprar.',
            },
        ],
    },
    {
        key: 'refeicaolivre',
        icon: 'pizza',
        color: '#FF9500',
        title: 'Refeição Livre',
        items: [
            {
                key: 'livre_sim',
                icon: '🎉',
                label: 'Refeição Livre Liberada',
                desc: 'Aparece no PDF: informa as regras da refeição livre (1x por semana, apenas se seguiu o plano, até a saciedade, retorno imediato).',
                text: '🎉 Refeição livre liberada 1x por semana, apenas se seguiu o plano 100% nos outros dias. Escolha UMA refeição do dia. Coma até a saciedade — não até passar mal. Retorne ao plano imediatamente na próxima refeição.',
            },
            {
                key: 'livre_nao',
                icon: '🚫',
                label: 'Sem Refeição Livre',
                desc: 'Aparece no PDF: bloqueia a refeição livre nesta fase e orienta o aluno a seguir o plano rigorosamente.',
                text: '🚫 Nenhuma refeição livre nesta fase. Siga o plano rigorosamente até nova orientação do coach.',
            },
            {
                key: 'livre_opcoes',
                icon: '🍕',
                label: 'Opções Inteligentes para a Livre',
                desc: 'Aparece no PDF: lista opções estratégicas para a refeição livre (pizza, hambúrguer, sushi, massa, sobremesa) com o que evitar em cada uma.',
                text: '🍕 Opções para a refeição livre: Pizza (2-3 fatias, evite calabresa/bacon), Hambúrguer artesanal (sem batata frita), Sushi (15-20 peças, evite hot rolls), Massa com proteína (evite molhos brancos pesados), ou uma sobremesa especial no lugar do jantar.',
            },
        ],
    },
    {
        key: 'motivacao',
        icon: 'trophy-outline',
        color: '#9B59B6',
        title: 'Mentalidade e Motivação',
        items: [
            {
                key: 'consistencia',
                icon: '🎯',
                label: 'A Regra da Consistência',
                desc: 'Aparece no PDF: lembra que consistência vale mais que perfeição e que um dia ruim não arruína a semana.',
                text: '🎯 Consistência bate perfeição. Um dia ruim não arruína a semana — o que arruína é desistir depois.',
            },
            {
                key: 'belisco',
                icon: '🍫',
                label: 'Cuidado com Beliscos',
                desc: 'Aparece no PDF: alerta sobre o impacto de beliscos fora do plano no déficit calórico e sugere beber água ou contatar o coach.',
                text: '⚠️ Aquela "beliscada" fora do plano pode destruir seu déficit calórico diário. Se a fome bater forte, beba água ou entre em contato.',
            },
            {
                key: 'balanca',
                icon: '📊',
                label: 'Sobre a Balança',
                desc: 'Aparece no PDF: explica que o peso oscila por retenção hídrica e orienta a avaliar a tendência semanal, não o peso diário.',
                text: '📊 O peso oscila diariamente por retenção hídrica. Meça-se sempre no mesmo horário (manhã, em jejum) e avalie a tendência semanal — não o dia a dia.',
            },
            {
                key: 'contato',
                icon: '📱',
                label: 'Fale com o Coach',
                desc: 'Aparece no PDF: incentiva o aluno a contatar o coach pelo WhatsApp antes de improvisar ajustes por conta própria.',
                text: '📱 Em caso de dúvidas, dificuldades ou necessidade de ajustes, entre em contato pelo WhatsApp antes de sair do plano por conta própria.',
            },
        ],
    },
];

export default function PdfNotesModal({ visible, onClose, onConfirm, theme }) {
    const [selected, setSelected] = useState({});
    const [extraNotes, setExtraNotes] = useState('');
    const [expandedSections, setExpandedSections] = useState({});

    function toggleItem(key) {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function toggleSection(key) {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    }

    function handleConfirm() {
        const lines = [];
        for (const section of SECTIONS) {
            for (const item of section.items) {
                if (selected[item.key]) lines.push(item.text);
            }
        }
        if (extraNotes.trim()) lines.push(extraNotes.trim());
        onConfirm(lines.join('\n\n'));
        setSelected({});
        setExtraNotes('');
        setExpandedSections({});
    }

    function handleClose() {
        setSelected({});
        setExtraNotes('');
        setExpandedSections({});
        onClose();
    }

    const selectedCount = Object.values(selected).filter(Boolean).length;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ width: '100%', flex: 1, justifyContent: 'flex-end' }}
                >
                    <View style={[styles.sheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>

                        <View style={[styles.handleBar, { backgroundColor: theme.border }]} />

                        {/* HEADER */}
                        <View style={styles.header}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.title, { color: theme.text }]}>📋 Observações do PDF</Text>
                                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                                    Selecione o que vai aparecer no final do documento para o aluno
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedCount > 0 && (
                            <View style={[styles.countBadge, { backgroundColor: theme.accent + '20', borderColor: theme.accent + '40' }]}>
                                <MaterialCommunityIcons name="check-circle" size={14} color={theme.accent} />
                                <Text style={[styles.countText, { color: theme.accent }]}>
                                    {selectedCount} observaç{selectedCount === 1 ? 'ão' : 'ões'} selecionada{selectedCount !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        )}

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {SECTIONS.map(section => {
                                const isExpanded = !!expandedSections[section.key];
                                const sectionCount = section.items.filter(i => selected[i.key]).length;

                                return (
                                    <View key={section.key} style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section.key)} activeOpacity={0.8}>
                                            <View style={[styles.sectionIconBox, { backgroundColor: section.color + '20' }]}>
                                                <MaterialCommunityIcons name={section.icon} size={20} color={section.color} />
                                            </View>
                                            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
                                            {sectionCount > 0 && (
                                                <View style={[styles.sectionBadge, { backgroundColor: section.color }]}>
                                                    <Text style={styles.sectionBadgeText}>{sectionCount}</Text>
                                                </View>
                                            )}
                                            <MaterialCommunityIcons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={20} color={theme.textSecondary}
                                            />
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View style={[styles.sectionBody, { borderTopColor: theme.border }]}>
                                                {section.items.map(item => {
                                                    const isOn = !!selected[item.key];
                                                    return (
                                                        <TouchableOpacity
                                                            key={item.key}
                                                            style={[
                                                                styles.itemRow,
                                                                { borderColor: theme.border, backgroundColor: theme.bg },
                                                                isOn && { backgroundColor: section.color + '10', borderColor: section.color + '50' },
                                                            ]}
                                                            onPress={() => toggleItem(item.key)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <Text style={styles.itemIcon}>{item.icon}</Text>
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={[styles.itemLabel, { color: isOn ? theme.text : theme.textSecondary, fontWeight: isOn ? '800' : '600' }]}>
                                                                    {item.label}
                                                                </Text>
                                                                <Text style={[styles.itemDesc, { color: theme.textSecondary }]}>
                                                                    {item.desc}
                                                                </Text>
                                                            </View>
                                                            <View style={[
                                                                styles.checkbox,
                                                                { borderColor: isOn ? section.color : theme.border },
                                                                isOn && { backgroundColor: section.color },
                                                            ]}>
                                                                {isOn && <MaterialCommunityIcons name="check" size={12} color="#000" />}
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}

                            {/* CAMPO LIVRE */}
                            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.sectionHeader, { paddingBottom: 0 }]}>
                                    <View style={[styles.sectionIconBox, { backgroundColor: '#00BFFF20' }]}>
                                        <MaterialCommunityIcons name="pencil-outline" size={20} color="#00BFFF" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Observação Personalizada</Text>
                                        <Text style={[styles.itemDesc, { color: theme.textSecondary, marginTop: 2 }]}>
                                            Digite qualquer instrução específica para este aluno. Aparece no PDF exatamente como escrito.
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.sectionBody, { borderTopColor: theme.border, paddingTop: 10 }]}>
                                    <TextInput
                                        style={[styles.extraInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                                        placeholder="Ex: Evite comer após as 22h. Nos dias de treino, priorize carboidrato no pré-treino..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={extraNotes}
                                        onChangeText={setExtraNotes}
                                        multiline
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        {/* BOTÕES */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                style={[styles.btnSecondary, { borderColor: theme.border }]}
                                onPress={() => { setSelected({}); setExtraNotes(''); onConfirm(''); }}
                            >
                                <Text style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>Gerar sem obs.</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnPrimary, { backgroundColor: theme.accent }]}
                                onPress={handleConfirm}
                            >
                                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#000" />
                                <Text style={styles.btnPrimaryText}>
                                    Gerar PDF{selectedCount > 0 ? ` (${selectedCount})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet:            { width: '100%', maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, paddingHorizontal: 20, paddingTop: 12 },
    handleBar:        { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    header:           { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
    title:            { fontSize: 17, fontWeight: '900' },
    subtitle:         { fontSize: 11, marginTop: 3, lineHeight: 16 },
    closeBtn:         { padding: 7, borderRadius: 10, borderWidth: 1, marginTop: 2 },
    countBadge:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 12 },
    countText:        { fontSize: 12, fontWeight: '700' },
    sectionCard:      { borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
    sectionHeader:    { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    sectionIconBox:   { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sectionTitle:     { flex: 1, fontSize: 13, fontWeight: '800' },
    sectionBadge:     { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
    sectionBadgeText: { fontSize: 10, fontWeight: '900', color: '#000' },
    sectionBody:      { borderTopWidth: 1, padding: 10, gap: 8 },
    itemRow:          { flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderRadius: 12, borderWidth: 1, gap: 10 },
    itemIcon:         { fontSize: 16, width: 24, textAlign: 'center', marginTop: 1 },
    itemLabel:        { fontSize: 12, marginBottom: 2 },
    itemDesc:         { fontSize: 10.5, lineHeight: 15 },
    checkbox:         { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    extraInput:       { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 13, minHeight: 90, maxHeight: 130 },
    footer:           { flexDirection: 'row', gap: 10, paddingTop: 14, paddingBottom: 34, borderTopWidth: 1, marginTop: 4 },
    btnSecondary:     { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    btnSecondaryText: { fontSize: 12, fontWeight: '700' },
    btnPrimary:       { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14 },
    btnPrimaryText:   { fontSize: 14, fontWeight: '900', color: '#000' },
});