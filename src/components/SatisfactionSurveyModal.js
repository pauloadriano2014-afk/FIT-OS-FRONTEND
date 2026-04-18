// src/components/SatisfactionSurveyModal.js
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, Modal, TouchableOpacity, 
    TextInput, ScrollView, ActivityIndicator 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SatisfactionSurveyModal({ visible, onClose, theme, userId, isPremium = false }) {
    const [appExperience, setAppExperience] = useState('');
    const [appExpReason, setAppExpReason] = useState('');
    
    const [visualExperience, setVisualExperience] = useState('');
    const [visualReason, setVisualReason] = useState('');

    const [toolsExperience, setToolsExperience] = useState('');
    const [toolsReason, setToolsReason] = useState('');

    const [libraryExperience, setLibraryExperience] = useState('');

    const [appImprovement, setAppImprovement] = useState('');
    const [coachSupport, setCoachSupport] = useState('');
    
    const [checkinExperience, setCheckinExperience] = useState('');
    const [checkinReason, setCheckinReason] = useState('');
    
    const [dietExperience, setDietExperience] = useState('');
    const [dietAdherence, setDietAdherence] = useState('');
    const [dietRoutine, setDietRoutine] = useState('');
    const [dietTools, setDietTools] = useState('');
    const [dietToolsReason, setDietToolsReason] = useState('');
    const [dietSubstitutions, setDietSubstitutions] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!appExperience || !checkinExperience || !toolsExperience || !visualExperience) {
            alert("Por favor, responda pelo menos as perguntas de múltipla escolha para me ajudar a melhorar!");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                userId,
                appExperience,
                appExpReason: appExperience === 'CONFUSO' ? appExpReason : null,
                visualExperience,
                visualReason: visualExperience === 'RUIM' ? visualReason : null,
                toolsExperience,
                toolsReason: toolsExperience === 'CONFUSO' ? toolsReason : null,
                libraryExperience,
                appImprovement,
                coachSupport,
                checkinExperience,
                checkinReason: checkinExperience === 'DIFICULDADE' ? checkinReason : null,
            };

            if (isPremium) {
                payload.dietExperience = dietExperience;
                payload.dietAdherence = dietAdherence;
                payload.dietRoutine = dietRoutine;
                payload.dietTools = dietTools;
                payload.dietToolsReason = dietTools === 'FALTA_ALGO' ? dietToolsReason : null;
                payload.dietSubstitutions = dietSubstitutions;
            }

            const res = await fetch('https://fitos-final.onrender.com/api/survey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const userObj = JSON.parse(storedUser);
                    userObj.npsRequested = false;
                    await AsyncStorage.setItem('user', JSON.stringify(userObj));
                }
                setShowSuccess(true);
            } else {
                alert("Ocorreu um erro ao enviar. Tente novamente.");
            }
        } catch (error) {
            alert("Erro de conexão.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderOption = (state, setState, value, label, icon, color) => {
        const isSelected = state === value;
        return (
            <TouchableOpacity 
                style={[
                    styles.optionBtn, 
                    { backgroundColor: theme.bg, borderColor: isSelected ? color : theme.border },
                    isSelected && { backgroundColor: color + '15' }
                ]}
                onPress={() => setState(value)}
            >
                <MaterialCommunityIcons name={icon} size={18} color={isSelected ? color : theme.textSecondary} />
                <Text style={[styles.optionText, { color: isSelected ? color : theme.text }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={showSuccess ? onClose : () => {}}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    
                    {showSuccess ? (
                        <View style={styles.successContainer}>
                            <MaterialCommunityIcons name="trophy-award" size={70} color="#4DE38F" />
                            <Text style={[styles.successTitle, { color: '#4DE38F' }]}>MUITO OBRIGADO! 🏆</Text>
                            <Text style={[styles.successDesc, { color: theme.text }]}>
                                Seu feedback é o combustível que eu preciso para deixar a consultoria cada vez mais foda e acelerar os seus resultados.
                            </Text>
                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#4DE38F', width: '100%', marginTop: 20 }]} onPress={onClose}>
                                <Text style={styles.submitText}>VALEU, COACH! 👊</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                    <MaterialCommunityIcons name="bullhorn" size={24} color="#4DE38F" />
                                    <Text style={[styles.title, { color: theme.text }]}>PESQUISA DE SATISFAÇÃO</Text>
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                                
                                {/* 1. APP GERAL */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>1. Como você avalia a facilidade de usar o nosso app para os treinos?</Text>
                                    <View style={styles.optionsRow}>
                                        {renderOption(appExperience, setAppExperience, 'EXCELENTE', 'Excelente', 'emoticon-cool', '#4DE38F')}
                                        {renderOption(appExperience, setAppExperience, 'BOM', 'Muito Bom', 'emoticon-happy', '#FFCC00')}
                                        {renderOption(appExperience, setAppExperience, 'CONFUSO', 'Confuso', 'emoticon-confused', '#FF3B30')}
                                    </View>
                                    {appExperience === 'CONFUSO' && (
                                        <View style={[styles.conditionalBox, { backgroundColor: theme.bg, borderColor: '#FF3B30' }]}>
                                            <Text style={[styles.condText, { color: '#FF3B30' }]}>Onde o app está travando ou ficou confuso?</Text>
                                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Digite aqui..." placeholderTextColor={theme.textSecondary} multiline value={appExpReason} onChangeText={setAppExpReason} />
                                        </View>
                                    )}
                                </View>

                                {/* 2. VISUAL */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>2. O que você achou do visual do aplicativo?</Text>
                                    <View style={styles.optionsRow}>
                                        {renderOption(visualExperience, setVisualExperience, 'EXCELENTE', 'Lindo demais', 'palette', '#4DE38F')}
                                        {renderOption(visualExperience, setVisualExperience, 'BOM', 'Padrão / Ok', 'palette-outline', '#FFCC00')}
                                        {renderOption(visualExperience, setVisualExperience, 'RUIM', 'Não gostei', 'eye-off', '#FF3B30')}
                                    </View>
                                    {visualExperience === 'RUIM' && (
                                        <View style={[styles.conditionalBox, { backgroundColor: theme.bg, borderColor: '#FF3B30' }]}>
                                            <Text style={[styles.condText, { color: '#FF3B30', lineHeight: 18 }]}>Sabia que lá na aba "Perfil" você pode mudar o app para o Modo Claro e escolher as cores Verde, Rosa, Roxo, Azul ou Vermelho? {"\n\n"}Qual outra cor você gostaria de ter no app?</Text>
                                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Sua sugestão de cor..." placeholderTextColor={theme.textSecondary} multiline value={visualReason} onChangeText={setVisualReason} />
                                        </View>
                                    )}
                                </View>

                                {/* 3. FERRAMENTAS INTELIGENTES */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>3. Como avalia nossas ferramentas (Chat IA, Calculadora RM, Vídeos de Execução e Análise Biomecânica)?</Text>
                                    <View style={styles.optionsRow}>
                                        {renderOption(toolsExperience, setToolsExperience, 'EXCELENTE', 'Me ajudam muito', 'robot', '#4DE38F')}
                                        {renderOption(toolsExperience, setToolsExperience, 'BOM', 'Uso pouco', 'robot-outline', '#FFCC00')}
                                        {renderOption(toolsExperience, setToolsExperience, 'CONFUSO', 'Difícil de usar', 'robot-dead', '#FF3B30')}
                                    </View>
                                    {toolsExperience === 'CONFUSO' && (
                                        <View style={[styles.conditionalBox, { backgroundColor: theme.bg, borderColor: '#FF3B30' }]}>
                                            <Text style={[styles.condText, { color: '#FF3B30' }]}>Qual ferramenta te deu dificuldade e por quê?</Text>
                                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Digite aqui..." placeholderTextColor={theme.textSecondary} multiline value={toolsReason} onChangeText={setToolsReason} />
                                        </View>
                                    )}
                                </View>

                                {/* 4. CHECK-IN E EVOLUÇÃO */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>4. Como avalia a dinâmica de Check-in (envio de fotos/peso, recebimento do meu laudo técnico no próprio app e o histórico de avaliações salvo na sua aba de Evolução)?</Text>
                                    <View style={styles.optionsRow}>
                                        {renderOption(checkinExperience, setCheckinExperience, 'PERFEITO', 'Excelente', 'target', '#4DE38F')}
                                        {renderOption(checkinExperience, setCheckinExperience, 'OK', 'Funciona bem', 'thumb-up', '#FFCC00')}
                                        {renderOption(checkinExperience, setCheckinExperience, 'DIFICULDADE', 'Tenho dificuldade', 'alert-circle', '#FF3B30')}
                                    </View>
                                    {checkinExperience === 'DIFICULDADE' && (
                                        <View style={[styles.conditionalBox, { backgroundColor: theme.bg, borderColor: '#FF3B30' }]}>
                                            <Text style={[styles.condText, { color: '#FF3B30' }]}>Qual a sua dificuldade? (ex: achar a aba, tamanho da foto, esquecimento...)</Text>
                                            <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Digite aqui..." placeholderTextColor={theme.textSecondary} multiline value={checkinReason} onChangeText={setCheckinReason} />
                                        </View>
                                    )}
                                </View>

                                {/* 5. BIBLIOTECA (PA FLIX) */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>5. O que acha da nossa Biblioteca (PA Flix)? Lá ficam seus e-books/áudios e, em breve, teremos novas dicas e conteúdos para você.</Text>
                                    <View style={styles.optionsRow}>
                                        {renderOption(libraryExperience, setLibraryExperience, 'EXCELENTE', 'Uso sempre', 'play-box-multiple', '#4DE38F')}
                                        {renderOption(libraryExperience, setLibraryExperience, 'BOM', 'Acesso às vezes', 'play-box-outline', '#FFCC00')}
                                        {renderOption(libraryExperience, setLibraryExperience, 'NUNCA', 'Ainda não vi', 'eye-off-outline', theme.textSecondary)}
                                    </View>
                                </View>

                                {/* 6 e 7. MELHORIAS E SUPORTE */}
                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>6. Sentiu falta de alguma funcionalidade no app?</Text>
                                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]} placeholder="Ex: Gráficos de evolução diferentes..." placeholderTextColor={theme.textSecondary} multiline value={appImprovement} onChangeText={setAppImprovement} />
                                </View>

                                <View style={styles.questionBlock}>
                                    <Text style={[styles.questionText, { color: theme.text }]}>7. Como está sendo o meu acompanhamento com você?</Text>
                                    <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]} placeholder="Elogios, críticas ou sugestões..." placeholderTextColor={theme.textSecondary} multiline value={coachSupport} onChangeText={setCoachSupport} />
                                </View>

                                {/* DIETA EXCLUSIVO */}
                                {isPremium && (
                                    <View style={[styles.questionBlock, { borderTopWidth: 2, borderTopColor: '#4DE38F', paddingTop: 20 }]}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10}}>
                                            <MaterialCommunityIcons name="food-apple" size={20} color="#4DE38F" />
                                            <Text style={{color: '#4DE38F', fontSize: 14, fontWeight: '900', letterSpacing: 1}}>MÓDULO DE DIETA (ELITE)</Text>
                                        </View>
                                        
                                        <Text style={[styles.questionText, { color: theme.text }]}>A separação dos dias de dieta de acordo com a sua rotina (dias de musculação, cardio, descanso) está funcionando bem?</Text>
                                        <View style={[styles.optionsRow, {marginBottom: 15}]}>
                                            {renderOption(dietRoutine, setDietRoutine, 'PERFEITO', 'Está Perfeito', 'calendar-check', '#4DE38F')}
                                            {renderOption(dietRoutine, setDietRoutine, 'BOM', 'Funciona bem', 'calendar-blank', '#FFCC00')}
                                            {renderOption(dietRoutine, setDietRoutine, 'CONFUSO', 'Acho confuso', 'calendar-remove', '#FF3B30')}
                                        </View>

                                        <Text style={[styles.questionText, { color: theme.text }]}>O Controle de Água e a Lista de Mercado no app estão te ajudando?</Text>
                                        <View style={[styles.optionsRow, {marginBottom: 15}]}>
                                            {renderOption(dietTools, setDietTools, 'MUITO', 'Sim, uso sempre', 'water', '#4DE38F')}
                                            {renderOption(dietTools, setDietTools, 'MEDIO', 'Uso pouco', 'cart-outline', '#FFCC00')}
                                            {renderOption(dietTools, setDietTools, 'FALTA_ALGO', 'Sinto falta de algo', 'alert', '#FF3B30')}
                                        </View>
                                        {dietTools === 'FALTA_ALGO' && (
                                            <View style={[styles.conditionalBox, { backgroundColor: theme.bg, borderColor: '#FF3B30', marginBottom: 15 }]}>
                                                <Text style={[styles.condText, { color: '#FF3B30' }]}>O que você adicionaria na Lista de Mercado ou na Água?</Text>
                                                <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} placeholder="Sua sugestão..." placeholderTextColor={theme.textSecondary} multiline value={dietToolsReason} onChangeText={setDietToolsReason} />
                                            </View>
                                        )}

                                        <Text style={[styles.questionText, { color: theme.text }]}>A visualização das refeições e as opções de substituição estão claras?</Text>
                                        <View style={[styles.optionsRow, {marginBottom: 15}]}>
                                            {renderOption(dietSubstitutions, setDietSubstitutions, 'OTIMO', 'Perfeitas', 'check-all', '#4DE38F')}
                                            {renderOption(dietSubstitutions, setDietSubstitutions, 'DIFICIL', 'Acho confuso', 'help-circle', '#FF3B30')}
                                        </View>

                                        <Text style={[styles.questionText, { color: theme.text }]}>Espaço livre (Dificuldades, adesão, rotina alimentar):</Text>
                                        <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.bg }]} placeholder="Conta como está a sua adaptação..." placeholderTextColor={theme.textSecondary} multiline value={dietExperience} onChangeText={setDietExperience} />
                                    </View>
                                )}

                            </ScrollView>

                            <View style={styles.footer}>
                                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#4DE38F' }]} onPress={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <ActivityIndicator color="#000" /> : (
                                        <>
                                            <MaterialCommunityIcons name="send" size={20} color="#000" />
                                            <Text style={styles.submitText}>ENVIAR FEEDBACK</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 10 },
    container: { width: '95%', maxWidth: 500, alignSelf: 'center', height: '85%', maxHeight: 800, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    title: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    questionBlock: { marginBottom: 30 },
    questionText: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, lineHeight: 22 },
    optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
    optionText: { fontSize: 12, fontWeight: 'bold' },
    conditionalBox: { marginTop: 15, padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    condText: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
    input: { minHeight: 80, borderRadius: 12, borderWidth: 1, padding: 15, fontSize: 16, textAlignVertical: 'top' },
    footer: { padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' },
    submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10 },
    submitText: { color: '#000', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
    successTitle: { fontSize: 24, fontWeight: '900', marginTop: 20, marginBottom: 15, textAlign: 'center' },
    successDesc: { fontSize: 15, lineHeight: 24, textAlign: 'center', fontStyle: 'italic' },
});