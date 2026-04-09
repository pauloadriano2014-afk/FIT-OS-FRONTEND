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

    // 🔥 ESTADOS DO SEMÁFORO INTELIGENTE
    const [semaforoConfig, setSemaforoConfig] = useState({ color: theme.border, icon: 'clock-outline', text: 'Calculando status...', bg: theme.bg });

    useEffect(() => {
        if (!nextCheckInDate || disableCheckIn) {
            setSemaforoConfig({ color: '#888', icon: disableCheckIn ? 'bell-off-outline' : 'calendar-remove', text: disableCheckIn ? 'Cobrança desativada para este aluno.' : 'Sem data definida.', bg: theme.surface });
            return;
        }

        // Converte a string "DD/MM/YYYY" para Date()
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

    return (
        <View>
            <Text style={[styles.sectionLabel, {marginTop: 40}]}>DADOS E SISTEMA</Text>
            
            {/* 🔥 BLINDAGEM: Enviando apenas o essencial para evitar o crash do Safari */}
            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminStudentCheckins', { aluno: { id: aluno.id, name: aluno.name } })}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 199, 89, 0.15)'}]}>
                    <MaterialCommunityIcons name="camera-front-variant" size={20} color="#34C759" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Gerenciar Check-ins do Aluno</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* 🔥 Aplicando a mesma blindagem para a tela de Evolução */}
            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminEvolution', { aluno: { id: aluno.id, name: aluno.name } })}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(50, 173, 230, 0.15)'}]}>
                    <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Ver Gráficos de Evolução</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleToggleStatus}>
                <View style={[styles.iconBox, {backgroundColor: isActiveUser ? theme.accent + '22' : 'rgba(255,59,48,0.15)'}]}>
                    <MaterialCommunityIcons name={isActiveUser ? "lock-open" : "lock"} size={20} color={isActiveUser ? theme.accent : "#FF3B30"} />
                </View>
                <Text style={[styles.actionText, {color: isActiveUser ? theme.text : '#FF3B30'}]}>
                    {isActiveUser ? "Aluno Ativo (Toque para Bloquear)" : "Aluno Bloqueado (Toque para Ativar)"}
                </Text>
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>CONFIGURAÇÃO DE CHECK-IN</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border}}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.accent} />
                    <Text style={{color: theme.accent, fontSize: 11, fontWeight: 'bold', flex: 1}}>{planLabel}</Text>
                </View>

                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border}}>
                    <View style={{flex: 1, paddingRight: 10}}>
                        <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 13}}>Desativar Cobrança</Text>
                        <Text style={{color: theme.textSecondary, fontSize: 11}}>Oculta os avisos e bloqueia a pulsação do botão para este aluno.</Text>
                    </View>
                    <Switch 
                        value={disableCheckIn}
                        onValueChange={handleToggleDisableCheckIn}
                        trackColor={{ false: '#333', true: '#FF3B30' }}
                        thumbColor={Platform.OS === 'ios' ? '#FFF' : (disableCheckIn ? '#000' : '#888')}
                    />
                </View>

                <Text style={[styles.sectionSubDesc, { marginBottom: 5 }]}>
                    {isCyclePlan 
                        ? `Defina a data para liberar o check-in. Após o envio, o sistema calcula automaticamente o próximo para o dia ${autoDays}.`
                        : `Defina uma data fixa ou deixe em branco para Piloto Automático (${autoDays} dias após cada envio).`
                    }
                </Text>

                {/* 🔥 O VISUALIZADOR SEMÁFORO 🔥 */}
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: semaforoConfig.bg, borderWidth: 1, borderColor: semaforoConfig.color, marginBottom: 15}}>
                    <MaterialCommunityIcons name={semaforoConfig.icon} size={20} color={semaforoConfig.color} />
                    <View style={{flex: 1}}>
                        <Text style={{color: semaforoConfig.color, fontSize: 10, fontWeight: '900', letterSpacing: 0.5}}>STATUS ATUAL:</Text>
                        <Text style={{color: semaforoConfig.color, fontSize: 13, fontWeight: 'bold', marginTop: 2}}>{semaforoConfig.text}</Text>
                    </View>
                </View>

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
                        style: { flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none', fontSize: '13px', fontFamily: 'inherit', fontWeight: 'bold' }
                    }) : (
                        <TextInput 
                            style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1, fontWeight: 'bold' }]} 
                            placeholder="DD/MM/AAAA" 
                            placeholderTextColor={theme.textSecondary}
                            value={nextCheckInDate}
                            onChangeText={handleCheckInDateChange}
                            keyboardType="numeric"
                            maxLength={10}
                            autoCapitalize="none"
                        />
                    )}
                    <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSaveCheckInDate}>
                        <MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: theme.accent + '15', borderWidth: 1, borderColor: theme.accent, borderStyle: 'dashed'}}
                    onPress={() => {
                        const today = new Date();
                        const dd = String(today.getDate()).padStart(2, '0');
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const yyyy = today.getFullYear();
                        handleCheckInDateChange(`${dd}/${mm}/${yyyy}`);
                        
                        const msg = "Data definida para HOJE. Clique em Salvar para confirmar.";
                        if (Platform.OS === 'web') window.alert(msg);
                        else Alert.alert("Liberado!", msg);
                    }}
                >
                    <MaterialCommunityIcons name="lock-open-variant" size={16} color={theme.accent} />
                    <Text style={{color: theme.accent, fontWeight: '900', fontSize: 11, letterSpacing: 0.5}}>LIBERAR CHECK-IN AGORA</Text>
                </TouchableOpacity>
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

            <TouchableOpacity style={styles.deleteUserRow} onPress={handleDeleteUser}>
                <MaterialCommunityIcons name="account-remove" size={20} color="#FFF" />
                <Text style={styles.deleteUserText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionLabel: { color:'#888', fontWeight:'900', marginBottom:5, fontSize:12, letterSpacing:1 },
    sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
    actionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, gap: 15, borderWidth:1 },
    iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent:'center', alignItems:'center' },
    actionText: { fontWeight: 'bold', fontSize: 13, flex:1 },
    card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
    inputPdf: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13, outlineStyle: 'none' },
    saveBtn: { padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 45, width: 45 },
    deleteUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
    deleteUserText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
});
