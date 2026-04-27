import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    ScrollView, TextInput, Linking, Platform, Alert 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminInviteModal({ visible, onClose, adminEmail, theme }) {
    const [activeTab, setActiveTab] = useState('PROPOSTA'); 
    const [leadName, setLeadName] = useState('');
    
    // 🔥 UNIFICADO: Agora foca apenas em ELITE (High-Ticket) ou START (Downsell)
    const [propostaType, setPropostaType] = useState('ELITE'); 

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
        onClose(); 
        setLeadName(''); 
        
        Linking.canOpenURL(whatsappUrl).then(supported => {
            if (supported) Linking.openURL(whatsappUrl);
            else {
                if (Platform.OS === 'web') window.open(whatsappUrl, '_blank');
                else Alert.alert("Aviso", "Não foi possível abrir o WhatsApp.");
            }
        }).catch(err => console.error('Erro ao abrir WhatsApp', err));
    };

    const getBaseUrl = () => {
        if (Platform.OS === 'web') {
            return window.location.origin; 
        }
        return 'https://www.pauloadrianoteam.com.br'; 
    };

    const generatePropostaLink = () => {
        const finalName = leadName.trim() || 'Atleta';
        const baseUrl = getBaseUrl();
        
        // Mantém a rota baseada no tipo selecionado
        const routeName = propostaType === 'START' ? 'PropostaStart' : 'Proposta';
        const inviteLink = `${baseUrl}/${routeName}?nome=${encodeURIComponent(finalName)}&plan=${propostaType}`; 
        
        // 🔥 COPY SPIN SELLING CORRIGIDA 🔥
        const message = `Fala, ${finalName}! Tudo bem?\n\nConforme conversamos, preparei um material completo para você entender exatamente como a nossa metodologia funciona e como vamos trabalhar juntos para transformar o seu corpo, sem perder tempo com treinos e dietas que não dão resultado.\n\nAcesse o link abaixo para ver todos os detalhes da consultoria, os bônus que você tem direito e os valores:\n\n🔗 ${inviteLink}\n\nDá uma olhada e me chama aqui para tirarmos qualquer dúvida e darmos o start, se fizer sentido pra você. 💪🔥`;
        
        openWhatsApp(message);
    };

    const generateCadastroLink = (planType) => {
        const { coachCode, teamName } = getCoachInfo();
        const baseUrl = getBaseUrl();
        const finalName = leadName.trim() || 'Atleta';
        
        const inviteLink = `${baseUrl}/registro?coach=${coachCode}&plan=${planType}`; 
        
        let planNameStr = '';
        if (planType === 'ELITE') planNameStr = 'Consultoria Elite (Treino + Dieta)';
        else if (planType === 'PERFORMANCE') planNameStr = 'Consultoria Performance (Só Treino)';
        else if (planType === 'LOW_COST') planNameStr = 'Plano Start';
        else if (planType === 'FICHA_8S') planNameStr = 'Projeto de 8 Semanas';
        else planNameStr = 'Desafio 21 Dias';

        // 🔥 FLUXO PWA CORRIGIDO 🔥
        const message = `Opa, ${finalName}! Chegou a hora de iniciarmos a sua ${planNameStr}.\n\nPara darmos o start oficial, acesse o link abaixo para criar a sua conta:\n\n🔗 ${inviteLink}\n\n📲 Após finalizar o cadastro, a própria página vai te mostrar o passo a passo bem simples para você instalar o aplicativo oficial direto no seu celular.\n\n🔑 Importante: Se o aplicativo pedir um Código de Convite no seu primeiro acesso, digite exatamente assim: *${coachCode}*\n\nFaça o seu cadastro por lá e me avise aqui para eu liberar o seu plano. Seja bem-vindo(a) ${teamName}! 💪🔥`;
        
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
                        
                        {activeTab === 'PROPOSTA' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>Gera um link para a página de vendas expirável. O cronômetro inicia no primeiro clique do aluno.</Text>
                                
                                <Text style={[styles.inputLabel, { color: theme.text }]}>NOME DO LEAD (Opcional):</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                                    placeholder="Ex: João Silva"
                                    placeholderTextColor={theme.textSecondary}
                                    value={leadName}
                                    onChangeText={setLeadName}
                                />

                                <Text style={[styles.inputLabel, { color: theme.text, marginTop: 20 }]}>TIPO DE OFERTA:</Text>
                                <View style={[styles.propostaTypeContainer, { backgroundColor: theme.bg, borderColor: theme.border, marginBottom: 10 }]}>
                                    <TouchableOpacity 
                                        style={[styles.propostaTypeBtn, propostaType === 'ELITE' && { backgroundColor: '#FFCC00' }]}
                                        onPress={() => setPropostaType('ELITE')}
                                    >
                                        <Text style={[styles.propostaTypeText, { color: propostaType === 'ELITE' ? '#000' : theme.textSecondary }]}>ELITE (HIGH-TICKET)</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.propostaTypeBtn, propostaType === 'START' && { backgroundColor: '#32ADE6' }]}
                                        onPress={() => setPropostaType('START')}
                                    >
                                        <Text style={[styles.propostaTypeText, { color: propostaType === 'START' ? '#FFF' : theme.textSecondary }]}>START (DOWNSELL)</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{fontSize: 10, color: theme.textSecondary, marginBottom: 15, textAlign: 'center'}}>
                                    {propostaType === 'ELITE' ? 'Consultoria Completa (Treino + Dieta)' : 'Plano de Entrada (Ficha de Treino)'}
                                </Text>

                                <TouchableOpacity 
                                    style={[styles.optionCard, {
                                        borderColor: propostaType === 'ELITE' ? '#FFCC00' : '#32ADE6', 
                                        backgroundColor: propostaType === 'ELITE' ? '#FFCC0011' : '#32ADE611', 
                                    }]} 
                                    onPress={generatePropostaLink}
                                >
                                    <View style={styles.optionLeft}>
                                        <MaterialCommunityIcons 
                                            name={propostaType === 'ELITE' ? "crown" : "rocket-launch"} 
                                            size={24} 
                                            color={propostaType === 'ELITE' ? '#FFCC00' : '#32ADE6'} 
                                        />
                                        <Text style={[styles.optionText, { color: propostaType === 'ELITE' ? '#FFCC00' : '#32ADE6', fontWeight: '900' }]}>
                                            ENVIAR PROPOSTA {propostaType}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color={propostaType === 'ELITE' ? '#FFCC00' : '#32ADE6'} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {activeTab === 'CADASTRO' && (
                            <View style={styles.tabSection}>
                                <Text style={[styles.sectionDesc, { color: theme.textSecondary, marginBottom: 15 }]}>Gera o link direto de cadastro no app. O aluno já entra com a conta configurada pro plano correto.</Text>
                                
                                <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 10 }]}>NOME DO NOVO ALUNO (Opcional):</Text>
                                <TextInput 
                                    style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 20 }]}
                                    placeholder="Ex: João Silva"
                                    placeholderTextColor={theme.textSecondary}
                                    value={leadName}
                                    onChangeText={setLeadName}
                                />

                                <View style={{ gap: 10 }}>
                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#FFCC00', backgroundColor: '#FFCC0011'}]} onPress={() => generateCadastroLink('ELITE')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="crown" size={24} color="#FFCC00" />
                                            <View>
                                                <Text style={[styles.optionText, { color: '#FFCC00' }]}>ELITE</Text>
                                                <Text style={{ fontSize: 9, color: '#FFCC00', fontWeight: 'bold' }}>TREINO + DIETA</Text>
                                            </View>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FFCC00" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#FF3B30', backgroundColor: '#FF3B3011'}]} onPress={() => generateCadastroLink('PERFORMANCE')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="weight-lifter" size={24} color="#FF3B30" />
                                            <View>
                                                <Text style={[styles.optionText, { color: '#FF3B30' }]}>PERFORMANCE</Text>
                                                <Text style={{ fontSize: 9, color: '#FF3B30', fontWeight: 'bold' }}>APENAS TREINO</Text>
                                            </View>
                                        </View>
                                        <MaterialCommunityIcons name="whatsapp" size={20} color="#FF3B30" />
                                    </TouchableOpacity>

                                    <TouchableOpacity style={[styles.optionCard, {borderColor: '#32ADE6', backgroundColor: '#32ADE611'}]} onPress={() => generateCadastroLink('LOW_COST')}>
                                        <View style={styles.optionLeft}>
                                            <MaterialCommunityIcons name="rocket-launch" size={24} color="#32ADE6" />
                                            <Text style={[styles.optionText, { color: '#32ADE6' }]}>PLANO START</Text>
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

    propostaTypeContainer: { flexDirection: 'row', borderRadius: 12, padding: 5, borderWidth: 1 },
    propostaTypeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
    propostaTypeText: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },

    tabSection: { paddingTop: 5 },
    sectionDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
    
    inputLabel: { fontSize: 11, fontWeight: '900', marginBottom: 8, letterSpacing: 0.5 },
    input: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },

    optionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    optionText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
});