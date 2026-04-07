// src/components/AdminUserSystem.js
import React, { createElement } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, Linking, Platform, Alert, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminUserSystem({
    theme, navigation, aluno, userPlan, isActiveUser, handleToggleStatus,
    disableCheckIn, handleToggleDisableCheckIn,
    nextCheckInDate, handleCheckInDateChange, handleSaveCheckInDate,
    evaluationUrl, setEvaluationUrl, handleSaveEvaluation, handleDeleteUser
}) {
    return (
        <View>
            <Text style={[styles.sectionLabel, {marginTop: 40}]}>DADOS E SISTEMA</Text>
            
            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminStudentCheckins', { aluno })}>
                <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 199, 89, 0.15)'}]}>
                    <MaterialCommunityIcons name="camera-front-variant" size={20} color="#34C759" />
                </View>
                <Text style={[styles.actionText, { color: theme.text }]}>Gerenciar Check-ins do Aluno</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminEvolution', { aluno })}>
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

            {userPlan === 'PREMIUM' && (
                <View>
                    <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>CONFIGURAÇÃO DE CHECK-IN</Text>
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
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

                        <Text style={[styles.sectionSubDesc, { marginBottom: 10 }]}>Defina uma data fixa para o aluno fazer o check-in. Deixe em branco para usar o Piloto Automático (14 dias).</Text>
                        
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
                                style: { flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none', fontSize: '13px', fontFamily: 'inherit' }
                            }) : (
                                <TextInput 
                                    style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]} 
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
                    </View>
                </View>
            )}

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