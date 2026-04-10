// src/components/AdminUserSystem.js
import React, { createElement, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, Linking, Platform, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PLAN_AUTO_DAYS = { PREMIUM: 14, PERFORMANCE: 30, standard: 30, LOW_COST: 30, FICHA_8S: 56, FICHAS: 56, CHALLENGE_21: 21 };
const PLAN_LABELS = { PREMIUM: 'Premium (a cada 14 dias)', PERFORMANCE: 'Básico (a cada 30 dias)', standard: 'Básico (a cada 30 dias)', LOW_COST: 'Básico (a cada 30 dias)', FICHA_8S: 'Fichas 8 Semanas (Dia 1 → Dia 56)', FICHAS: 'Fichas 8 Semanas (Dia 1 → Dia 56)', CHALLENGE_21: 'Desafio 21 Dias (Dia 1 → Dia 21)' };

export default function AdminUserSystem({
    theme, navigation, aluno, userPlan, isActiveUser, handleToggleStatus,
    disableCheckIn, handleToggleDisableCheckIn,
    nextCheckInDate, handleCheckInDateChange, handleSaveCheckInDate,
    evaluationUrl, setEvaluationUrl, handleSaveEvaluation, handleDeleteUser
}) {

    const autoDays = PLAN_AUTO_DAYS[userPlan] || 14;
    const planLabel = PLAN_LABELS[userPlan] || 'Personalizado';
    const isCyclePlan = ['FICHA_8S', 'FICHAS', 'CHALLENGE_21'].includes(userPlan);

    const [semaforoConfig, setSemaforoConfig] = useState({ color: theme.border, icon: 'clock-outline', text: 'Calculando status...', bg: theme.bg });

    useEffect(() => {
        if (!nextCheckInDate || disableCheckIn) {
            setSemaforoConfig({ color: '#888', icon: disableCheckIn ? 'bell-off-outline' : 'calendar-remove', text: disableCheckIn ? 'Cobrança desativada para este aluno.' : 'Sem data definida.', bg: theme.surface });
            return;
        }

        const parts = nextCheckInDate.split('/');
        if (parts.length !== 3) return;
        
        const targetDate = new Date(parts[2], parts[1] - 1, parts[0]);
        targetDate.setHours(0,0,0,0);
        
        const today = new Date();
        today.setHours(0,0,0,0);

        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

        if (diffDays < 0) {
            setSemaforoConfig({ color: theme.isDark ? '#FFF' : '#000', icon: 'alert-decagram', text: `Atrasado há ${Math.abs(diffDays)} dia(s)`, bg: theme.isDark ? '#222' : '#E5E5E5' });
        } else if (diffDays === 0) {
            setSemaforoConfig({ color: '#FF3B30', icon: 'bell-ring', text: 'É HOJE! Cobrança ativa no app do aluno.', bg: '#FF3B3022' });
        } else if (diffDays <= 3) {
            setSemaforoConfig({ color: '#FF3B30', icon: 'timer-sand', text: `Atenção: Faltam apenas ${diffDays} dias!`, bg: '#FF3B3022' });
        } else if (diffDays <= 7) {
            setSemaforoConfig({ color: '#FF9500', icon: 'calendar-clock', text: `Faltam ${diffDays} dias para o envio.`, bg: '#FF950022' });
        } else {
            setSemaforoConfig({ color: '#32ADE6', icon: 'shield-check', text: `Faltam ${diffDays} dias. Aluno no prazo.`, bg: '#32ADE622' });
        }
    }, [nextCheckInDate, disableCheckIn]);

    const goToCheckins = () => {
        navigation.navigate('AdminStudentCheckins', {
            alunoId: String(aluno.id),
            alunoName: String(aluno.name)
        });
    };

    const goToEvolution = () => {
        navigation.navigate('AdminEvolution', {
            alunoId: String(aluno.id),
            alunoName: String(aluno.name),
            alunoBirthDate: String(aluno.birthDate || ''),
            alunoGender: String(aluno.gender || '')
        });
    };

    return (
        <View>
            <Text style={[styles.sectionLabel, {marginTop: 20}]}>FERRAMENTAS DO ALUNO</Text>
            
            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={goToCheckins}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 199, 89, 0.15)'}]}>
                    <MaterialCommunityIcons name="camera-front-variant" size={20} color="#34C759" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Gerenciar Check-ins do Aluno</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={goToEvolution}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(50, 173, 230, 0.15)'}]}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Ver Gráficos de Evolução</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>CONFIGURAÇÃO DE AVALIAÇÃO</Text>
            
            <View style={[styles.premiumCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                    <View style={[styles.iconBox, {backgroundColor: theme.accent + '22'}]}>
                        <MaterialCommunityIcons name="calendar-sync" size={20} color={theme.accent} />
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={[styles.cardTitle, {color: theme.text}]}>Regra de Cobrança Atual</Text>
                        <Text style={{color: theme.accent, fontSize: 11, fontWeight: 'bold'}}>{planLabel}</Text>
                    </View>
                </View>

                <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                    <View style={{flex: 1, paddingRight: 15}}>
                        <Text style={{color: theme.text, fontWeight: '900', fontSize: 13, marginBottom: 4}}>Bloquear Cobrança de Fotos</Text>
                        <Text style={{color: theme.textSecondary, fontSize: 11, lineHeight: 16}}>Oculta os avisos no app do aluno e desativa a pulsação do botão.</Text>
                    </View>
                    <Switch 
                        value={disableCheckIn}
                        onValueChange={handleToggleDisableCheckIn}
                        trackColor={{ false: theme.border, true: '#FF3B30' }}
                        thumbColor={Platform.OS === 'ios' ? '#FFF' : (disableCheckIn ? '#FFF' : '#888')}
                    />
                </View>

                <View style={{ padding: 20 }}>
                    <Text style={{color: theme.textSecondary, fontSize: 11, marginBottom: 15, fontWeight: '600'}}>
                        {isCyclePlan 
                            ? `Defina a data para liberar o check-in. Após o envio, o sistema calcula o próximo para o dia ${autoDays}.`
                            : `Defina uma data fixa ou deixe em branco para Piloto Automático (${autoDays} dias após cada envio).`
                        }
                    </Text>

                    <View style={[styles.statusBadge, { backgroundColor: semaforoConfig.bg, borderColor: semaforoConfig.color }]}>
                        <MaterialCommunityIcons name={semaforoConfig.icon} size={24} color={semaforoConfig.color} />
                        <View style={{flex: 1, marginLeft: 12}}>
                            <Text style={{color: semaforoConfig.color, fontSize: 9, fontWeight: '900', letterSpacing: 1}}>STATUS DO SISTEMA</Text>
                            <Text style={{color: semaforoConfig.color, fontSize: 14, fontWeight: 'bold', marginTop: 2}}>{semaforoConfig.text}</Text>
                        </View>
                    </View>

                    <Text style={{color: theme.text, fontSize: 11, fontWeight: '900', marginBottom: 8, marginTop: 20}}>NOVA DATA DE COBRANÇA:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {Platform.OS === 'web' ? createElement('input', {
                            type: 'date',
                            value: nextCheckInDate && nextCheckInDate.length === 10 ? nextCheckInDate.split('/').reverse().join('-') : '',
                            onChange: (e) => {
                                const val = e.target.value;
                                if(val) {
                                    const [y, m, d] = val.split('-');
                                    handleCheckInDateChange(`${d}/${m}/${y}`);
                                } else {
                                    handleCheckInDateChange('');
                                }
                            },
                            style: { flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none', fontSize: '14px', fontFamily: 'inherit', fontWeight: 'bold' }
                        }) : (
                            <TextInput 
                                style={[styles.inputLarge, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} 
                                placeholder="DD/MM/AAAA" 
                                placeholderTextColor={theme.textSecondary}
                                value={nextCheckInDate}
                                onChangeText={handleCheckInDateChange}
                                keyboardType="numeric"
                                maxLength={10}
                                autoCapitalize="none"
                            />
                        )}
                        <TouchableOpacity style={[styles.saveBtnLg, { backgroundColor: theme.accent }]} onPress={handleSaveCheckInDate}>
                            <MaterialCommunityIcons name="check-bold" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={[styles.quickReleaseBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                        onPress={() => {
                            const today = new Date();
                            const dd = String(today.getDate()).padStart(2, '0');
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const yyyy = today.getFullYear();
                            handleCheckInDateChange(`${dd}/${mm}/${yyyy}`);
                            
                            const msg = "Data definida para HOJE. Clique no botão Verde (✔) para salvar e confirmar no banco.";
                            if (Platform.OS === 'web') window.alert(msg);
                            else Alert.alert("Atenção", msg);
                        }}
                    >
                        <MaterialCommunityIcons name="flash" size={18} color={theme.accent} />
                        <Text style={{color: theme.text, fontWeight: '900', fontSize: 11, letterSpacing: 0.5}}>PREENCHER DATA COM HOJE (AGORA)</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>AVALIAÇÃO EM PDF (GOOGLE DRIVE)</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
                <Text style={[styles.sectionSubDesc, { marginBottom: 10 }]}>Cole o link público do Google Drive com a avaliação do Canva.</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TextInput 
                        style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]} 
                        placeholder="https://drive.google.com/..." 
                        placeholderTextColor={theme.textSecondary}
                        value={evaluationUrl}
                        onChangeText={setEvaluationUrl}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveEvaluation}>
                        <MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                </View>

                {evaluationUrl ? (
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                        <TouchableOpacity 
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }}
                            onPress={() => Linking.openURL(evaluationUrl)}
                        >
                            <MaterialCommunityIcons name="eye" size={16} color={theme.text} />
                            <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>VER PDF ATUAL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: '#FF3B30' }}
                            onPress={() => {
                                setEvaluationUrl('');
                                if (Platform.OS === 'web') window.alert("Link removido da caixa. Clique no botão de Salvar para confirmar.");
                                else Alert.alert("Aviso", "Link removido da caixa. Clique no botão de Salvar para confirmar a exclusão no banco.");
                            }}
                        >
                            <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" />
                            <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>LIMPAR</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>

            <Text style={[styles.sectionLabel, {marginTop: 30, color: '#FF3B30'}]}>ZONA DE RISCO</Text>
            
            <View style={[styles.riskCard, { backgroundColor: theme.surface, borderColor: '#FF3B30' }]}>
                <View style={[styles.switchRow, { borderBottomColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <View style={{flex: 1, paddingRight: 15}}>
                        <Text style={{color: isActiveUser ? theme.text : '#FF3B30', fontWeight: '900', fontSize: 13, marginBottom: 4}}>
                            Status de Acesso: {isActiveUser ? "ATIVO" : "BLOQUEADO"}
                        </Text>
                        <Text style={{color: theme.textSecondary, fontSize: 11, lineHeight: 16}}>
                            {isActiveUser 
                                ? "O aluno consegue logar e usar o app normalmente."
                                : "O aluno será deslogado e impedido de acessar o app."
                            }
                        </Text>
                    </View>
                    <Switch 
                        value={isActiveUser}
                        onValueChange={handleToggleStatus}
                        trackColor={{ false: theme.border, true: '#34C759' }} 
                        thumbColor={Platform.OS === 'ios' ? '#FFF' : (isActiveUser ? '#FFF' : '#888')}
                    />
                </View>

                <View style={{ padding: 20 }}>
                    <Text style={{color: theme.textSecondary, fontSize: 11, marginBottom: 15, fontWeight: '600', textAlign: 'center'}}>
                        ⚠️ ATENÇÃO: A exclusão é irreversível e apaga todos os treinos, fotos, histórico e dados do aluno permanentemente.
                    </Text>
                    
                    <TouchableOpacity style={styles.deleteUserBtn} onPress={handleDeleteUser}>
                        <MaterialCommunityIcons name="account-remove" size={18} color="#FFF" />
                        <Text style={styles.deleteUserBtnText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionLabel: { color:'#888', fontWeight:'900', marginBottom:15, fontSize:12, letterSpacing:1 },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, marginBottom: 12, gap: 15, borderWidth:1, elevation: 2, shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent:'center', alignItems:'center' },
    actionText: { fontWeight: '900', fontSize: 14, flex:1, letterSpacing: 0.5 },
    
    premiumCard: { borderRadius: 24, marginBottom: 20, borderWidth: 1, overflow: 'hidden', elevation: 4, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderBottomWidth: 1 },
    cardTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1 },
    
    inputLarge: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 15, fontWeight: 'bold' },
    saveBtnLg: { width: 54, height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    quickReleaseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15, padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
    
    card: { borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1 },
    sectionSubDesc: { color: '#888', fontSize: 12, marginBottom: 15, lineHeight: 18 },
    inputPdf: { padding: 15, borderRadius: 12, borderWidth: 1, fontSize: 14, outlineStyle: 'none' },
    saveBtn: { padding: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', height: 50, width: 50 },
    
    riskCard: { borderRadius: 24, marginBottom: 30, borderWidth: 2, overflow: 'hidden', elevation: 6, shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.15, shadowRadius: 10 },
    deleteUserBtn: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 16, borderRadius: 12, gap: 10, elevation: 3 },
    deleteUserBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
});