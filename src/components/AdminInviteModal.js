// src/components/AdminInviteModal.js
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, TextInput, Linking, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminInviteModal({ visible, onClose, adminEmail, theme }) {
    const [activeTab, setActiveTab] = useState('PROPOSTA'); // 'PROPOSTA' ou 'CADASTRO'
    const [leadName, setLeadName] = useState('');

    const getCoachInfo = () => {
        let coachCode = 'PATEAM'; 
        let teamName = "à nossa equipe";
        
        if (adminEmail && adminEmail.toLowerCase().includes('adri.personal@hotmail.com')) {
            coachCode = 'CURVAS';
            teamName = "ao projeto Costas & Curvas";
        }
        return { coachCode, teamName };
    };

    const openWhatsApp = (message) => {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        onClose(); // Fecha o modal
        setLeadName(''); // Limpa o input
        
        Linking.canOpenURL(whatsappUrl).then(supported => {
            if (supported) Linking.openURL(whatsappUrl);
            else {
                if (Platform.OS === 'web') window.open(whatsappUrl, '_blank');
                else Alert.alert("Aviso", "Não foi possível abrir o WhatsApp.");
            }
        }).catch(err => console.error('Erro ao abrir WhatsApp', err));
    };

    const generatePropostaLink = () => {
        const { teamName } = getCoachInfo();
        const finalName = leadName.trim() || 'Novo Aluno';
        const inviteLink = `https://www.pauloadrianoteam.com.br/Proposta?nome=${encodeURIComponent(finalName)}`; 
        
        const message = `Fala, ${finalName}! Tudo pronto para começarmos o seu processo.\n\nPara darmos o start, acesse o seu convite VIP abaixo, conheça a plataforma exclusiva e destrave o seu acesso:\n\n${inviteLink}\n\nSeja bem-vindo(a) ${teamName}! 💪🔥`;
        openWhatsApp(message);
    };

    const generateCadastroLink = (planType) => {
        const { coachCode, teamName } = getCoachInfo();
        const inviteLink = `https://www.pauloadrianoteam.com.br/registro?coach=${coachCode}&plan=${planType}`; 
        
        const planNameStr = planType === 'PREMIUM' ? 'Consultoria Premium' : (planType === 'LOW_COST' ? 'Plano de Fichas' : 'Desafio');
        const message = `Opa! Tudo pronto para começarmos o seu ${planNameStr}.\n\nPara darmos o start, acesse o link abaixo, instale o aplicativo oficial e faça seu cadastro:\n\n${inviteLink}\n\nSeja bem-vindo(a) ${teamName}! 💪🔥`;
        openWhatsApp(message);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    <View style={styles.headerRow}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>GERAR LINK</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* ABAS DO MODAL */}
                    <View style={[styles.tabsContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <TouchableOpacity 
                            style={[styles.tabBtn, activeTab === 'PROPOSTA' && { backgroundColor: theme.accent }]}
                            onPress={() => setActiveTab('PROPOSTA')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'PROPOSTA' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>PÁGINA DE VENDAS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tabBtn, activeTab === 'CADASTRO' && { backgroundColor: theme.accent }]}
                            onPress={() => setActiveTab('CADASTRO')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'CADASTRO' ? (theme.isDark ? '#000' : '#FFF') : theme.textSecondary }]}>CADASTRO DIRETO</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                        
                        {/* CONTEÚDO: PROPOSTA VIP */}
                        {activeTab === 'PROPOSTA' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>Gera um link para a sua página de proposta expirável focada no plano High-Ticket.</Text>
                                
                                <Text style={[styles.inputLabel, { color: theme.text }]}>NOME DO LEAD (Opcional):</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Ex: João Silva"
                                    placeholderTextColor={theme.textSecondary}
                                    value={leadName}
                                    onChangeText={setLeadName}
                                />

                                <TouchableOpacity style={[styles.optionCard, {borderColor: theme.accent, backgroundColor: theme.accent + '11', marginTop: 15}]} onPress={generatePropostaLink}>
                                    <View style={styles.optionLeft}>
                                        <MaterialCommunityIcons name="star-shooting" size={24} color={theme.accent} />
                                        <Text style={[styles.optionText, { color: theme.accent, fontWeight: '900' }]}>ENVIAR PROPOSTA VIP</Text>
                                    </View>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color={theme.accent} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* CONTEÚDO: CADASTRO DIRETO */}
                        {activeTab === 'CADASTRO' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary, marginBottom: 15 }]}>Gera o link direto de cadastro no app. O aluno já entra com o plano selecionado.</Text>
                                
                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#FFCC00', backgroundColor: '#FFCC0011'}]} onPress={() => generateCadastroLink('PREMIUM')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="crown" size={24} color="#FFCC00" />
                                            <Text style={[styles.optionText, { color: '#FFCC00' }]}>CONSULTORIA PREMIUM</Text>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FFCC00" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#32ADE6', backgroundColor: '#32ADE611'}]} onPress={() => generateCadastroLink('LOW_COST')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="rocket-launch" size={24} color="#32ADE6" />
                                            <Text style={[styles.optionText, { color: '#32ADE6' }]}>PLANO BÁSICO</Text>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#32ADE6" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#AF52DE', backgroundColor: '#AF52DE11'}]} onPress={() => generateCadastroLink('FICHA_8S')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={24} color="#AF52DE" />
                                            <Text style={[styles.optionText, { color: '#AF52DE' }]}>FICHA 8 SEMANAS</Text>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#AF52DE" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#FF9500', backgroundColor: '#FF950011'}]} onPress={() => generateCadastroLink('CHALLENGE_21')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="fire" size={24} color="#FF9500" />
                                            <Text style={[styles.optionText, { color: '#FF9500' }]}>DESAFIO 21 DIAS</Text>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FF9500" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { width: '100%', maxWidth: 400, borderRadius: 24, padding: 20, borderWidth: 1, maxHeight: '85%', marginTop: 'auto', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    tabsContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, marginBottom: 20, borderWidth: 1 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    tabText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

    tabSection: { paddingTop: 5 },
    sectionDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
    
    inputLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },

    optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});