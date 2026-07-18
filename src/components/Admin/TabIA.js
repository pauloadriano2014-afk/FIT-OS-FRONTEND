// src/components/Admin/TabIA.js
// Configurações de IA para coaches parceiros
// - Prompt customizado de avaliação de check-in
// - Modo: junto ao base (ADD) ou substituir (REPLACE)
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Platform, Alert, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://fitos-final.onrender.com';

const PROMPT_PLACEHOLDER = `Exemplos do que você pode escrever aqui:

"Você é a Coach Ana Lima, especialista em emagrecimento feminino. Use sempre um tom acolhedor e motivacional. Foque especialmente na região abdominal e nos glúteos. Evite termos técnicos e fale como uma amiga que entende de fitness."

"Ao analisar as fotos, sempre pergunte no texto sobre a qualidade do sono e hidratação da aluna, pois esses fatores afetam muito os resultados que vejo nas fotos."

"Quando houver evolução visível, mencione que o método que uso (Método X) foi desenvolvido especificamente para esse tipo de resultado."`;

const BASE_PROMPT_DESCRIPTION = `O prompt base da plataforma já instrui a IA a:

• Analisar cada ângulo (frente, lado, costas) separadamente
• Respeitar regras de gênero (não comentar peitoral em mulheres)
• Comparar fotos atuais com anteriores quando disponíveis
• Usar linguagem simples e acessível, sem jargão técnico
• Formatar o texto para leitura no celular (parágrafos curtos)
• Identificar o plano do aluno e adaptar o tom
• Valorizar a constância antes de elogiar o corpo
• Terminar com sua assinatura automaticamente`;

export default function TabIA({ theme, currentUserId }) {
    const [prompt,    setPrompt]    = useState('');
    const [mode,      setMode]      = useState('ADD'); // 'ADD' | 'REPLACE'
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [showBase,  setShowBase]  = useState(false);
    const [coachName, setCoachName] = useState('');

    useEffect(() => {
        if (currentUserId) {
            loadSettings();
            loadCoachName();
        }
    }, [currentUserId]);

    const loadCoachName = async () => {
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCoachName(user.name?.split(' ')[0] ?? 'Coach');
            }
        } catch {}
    };

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coach-settings?coachId=${currentUserId}`);
            if (res.ok) {
                const data = await res.json();
                setPrompt(data.aiCheckinPrompt ?? '');
                setMode(data.aiPromptMode ?? 'ADD');
            }
        } catch (e) {
            console.log('[TabIA] load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coach-settings`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    coachId:         currentUserId,
                    aiCheckinPrompt: prompt,
                    aiPromptMode:    mode,
                }),
            });

            if (!res.ok) throw new Error('Erro ao salvar');

            const msg = 'Configurações de IA salvas com sucesso!';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Salvo!', msg);

        } catch (e) {
            const msg = 'Não foi possível salvar. Tente novamente.';
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Erro', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        const msg = 'Limpar o prompt? A IA voltará a usar apenas o padrão da plataforma.';
        const run = () => setPrompt('');
        if (Platform.OS === 'web') { if (window.confirm(msg)) run(); }
        else Alert.alert('Limpar prompt', msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Limpar', style: 'destructive', onPress: run },
        ]);
    };

    if (loading) {
        return (
            <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.accent} />
            </View>
        );
    }

    return (
        <View style={{ gap: 16 }}>

            {/* ── CARD: ASSINATURA ─────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.accent + '40' }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.accent + '18' }]}>
                        <MaterialCommunityIcons name="draw-pen" size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>ASSINATURA AUTOMÁTICA</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                            Toda avaliação já termina com:
                        </Text>
                    </View>
                </View>
                <View style={[styles.signatureBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, fontStyle: 'italic', lineHeight: 20 }}>
                        Seu Coach,{'\n'}
                        <Text style={{ color: theme.accent, fontWeight: '900' }}>{coachName || 'Seu Nome'}</Text>
                    </Text>
                </View>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    O nome é puxado automaticamente do seu cadastro. Para alterar, edite seu perfil.
                </Text>
            </View>

            {/* ── CARD: O QUE O BASE JÁ FAZ ───────────────────────────── */}
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowBase(p => !p)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: '#32ADE620' }]}>
                        <MaterialCommunityIcons name="information-outline" size={20} color="#32ADE6" />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>O QUE O PROMPT BASE JÁ FAZ</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                            Toque para {showBase ? 'ocultar' : 'ver'} o que já vem configurado
                        </Text>
                    </View>
                    <MaterialCommunityIcons
                        name={showBase ? 'chevron-up' : 'chevron-down'}
                        size={20} color={theme.textSecondary}
                    />
                </View>
                {showBase && (
                    <View style={[styles.baseDescBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, lineHeight: 20 }}>
                            {BASE_PROMPT_DESCRIPTION}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* ── CARD: MODO ───────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.accent + '18' }]}>
                        <MaterialCommunityIcons name="tune-variant" size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>MODO DE USO</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                            Como seu prompt se relaciona com o base
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    {/* Botão ADD */}
                    <TouchableOpacity
                        style={[
                            styles.modeBtn,
                            { borderColor: mode === 'ADD' ? theme.accent : theme.border,
                              backgroundColor: mode === 'ADD' ? theme.accent + '15' : theme.bg },
                        ]}
                        onPress={() => setMode('ADD')}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="plus-circle-outline"
                            size={22}
                            color={mode === 'ADD' ? theme.accent : theme.textSecondary}
                        />
                        <Text style={[styles.modeBtnTitle, { color: mode === 'ADD' ? theme.accent : theme.text }]}>
                            JUNTO AO BASE
                        </Text>
                        <Text style={[styles.modeBtnDesc, { color: theme.textSecondary }]}>
                            Seu prompt é adicionado ao final do base. A IA recebe os dois. Recomendado para personalizar o tom sem perder a estrutura.
                        </Text>
                        {mode === 'ADD' && (
                            <View style={[styles.selectedBadge, { backgroundColor: theme.accent }]}>
                                <MaterialCommunityIcons name="check" size={10} color="#000" />
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>ATIVO</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Botão REPLACE */}
                    <TouchableOpacity
                        style={[
                            styles.modeBtn,
                            { borderColor: mode === 'REPLACE' ? '#FF9500' : theme.border,
                              backgroundColor: mode === 'REPLACE' ? '#FF950015' : theme.bg },
                        ]}
                        onPress={() => setMode('REPLACE')}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons
                            name="swap-horizontal"
                            size={22}
                            color={mode === 'REPLACE' ? '#FF9500' : theme.textSecondary}
                        />
                        <Text style={[styles.modeBtnTitle, { color: mode === 'REPLACE' ? '#FF9500' : theme.text }]}>
                            SUBSTITUIR BASE
                        </Text>
                        <Text style={[styles.modeBtnDesc, { color: theme.textSecondary }]}>
                            Só o seu prompt é usado. Você tem controle total. Requer um prompt bem completo para bons resultados.
                        </Text>
                        {mode === 'REPLACE' && (
                            <View style={[styles.selectedBadge, { backgroundColor: '#FF9500' }]}>
                                <MaterialCommunityIcons name="check" size={10} color="#000" />
                                <Text style={{ fontSize: 9, fontWeight: '900', color: '#000' }}>ATIVO</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {mode === 'REPLACE' && (
                    <View style={[styles.warningBox, { backgroundColor: '#FF950015', borderColor: '#FF950040' }]}>
                        <MaterialCommunityIcons name="alert-outline" size={14} color="#FF9500" />
                        <Text style={{ flex: 1, color: '#FF9500', fontSize: 11, fontWeight: '700', lineHeight: 16 }}>
                            No modo SUBSTITUIR, você é responsável por instruir a IA sobre gênero, formato, tom e estrutura. A assinatura com seu nome ainda é adicionada automaticamente.
                        </Text>
                    </View>
                )}
            </View>

            {/* ── CARD: PROMPT ─────────────────────────────────────────── */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.accent + '18' }]}>
                        <MaterialCommunityIcons name="text-box-edit-outline" size={20} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>SEU PROMPT</Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                            {mode === 'ADD'
                                ? 'Escreva direcionamentos extras para a IA'
                                : 'Escreva o prompt completo que a IA vai usar'}
                        </Text>
                    </View>
                    {prompt.length > 0 && (
                        <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                            <MaterialCommunityIcons name="close-circle-outline" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                    )}
                </View>

                <TextInput
                    style={[styles.promptInput, {
                        color:           theme.text,
                        borderColor:     theme.border,
                        backgroundColor: theme.bg,
                    }]}
                    value={prompt}
                    onChangeText={setPrompt}
                    placeholder={PROMPT_PLACEHOLDER}
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    textAlignVertical="top"
                />

                <View style={[styles.charCount, { borderColor: theme.border }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 10 }}>
                        {prompt.length} caracteres
                        {prompt.length === 0 ? ' — sem prompt customizado, apenas o base será usado' : ''}
                    </Text>
                </View>
            </View>

            {/* ── BOTÃO SALVAR ─────────────────────────────────────────── */}
            <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
            >
                {saving
                    ? <ActivityIndicator color="#000" />
                    : <>
                        <MaterialCommunityIcons name="content-save-outline" size={20} color="#000" />
                        <Text style={{ fontWeight: '900', fontSize: 14, color: '#000', letterSpacing: 0.5 }}>
                            SALVAR CONFIGURAÇÕES
                        </Text>
                    </>
                }
            </TouchableOpacity>

            {/* ── ESPAÇO RESERVADO PARA MÓDULOS (PRÓXIMA FASE) ────────── */}
            <View style={[styles.card, {
                backgroundColor: theme.surface,
                borderColor:     theme.border,
                borderStyle:     'dashed',
                opacity:         0.5,
            }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.border }]}>
                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.textSecondary} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>
                            CONTROLE DE MÓDULOS — EM BREVE
                        </Text>
                        <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
                            Defina se cada aluno tem acesso a treino, dieta ou ambos
                        </Text>
                    </View>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        borderWidth:  1,
        padding:      16,
        gap:          12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems:    'center',
    },
    iconBox: {
        width:         38,
        height:        38,
        borderRadius:  12,
        alignItems:    'center',
        justifyContent:'center',
    },
    cardTitle: {
        fontSize:     12,
        fontWeight:   '900',
        letterSpacing: 0.8,
    },
    cardSub: {
        fontSize:   11,
        marginTop:  2,
        lineHeight: 15,
    },
    signatureBox: {
        padding:      14,
        borderRadius: 12,
        borderWidth:  1,
    },
    hint: {
        fontSize:   11,
        lineHeight: 16,
        fontStyle:  'italic',
    },
    baseDescBox: {
        marginTop:    12,
        padding:      14,
        borderRadius: 12,
        borderWidth:  1,
    },
    modeBtn: {
        flex:         1,
        borderWidth:  1,
        borderRadius: 14,
        padding:      14,
        gap:          8,
        alignItems:   'center',
        position:     'relative',
    },
    modeBtnTitle: {
        fontSize:     11,
        fontWeight:   '900',
        letterSpacing: 0.5,
        textAlign:    'center',
    },
    modeBtnDesc: {
        fontSize:   10,
        lineHeight: 14,
        textAlign:  'center',
    },
    selectedBadge: {
        position:     'absolute',
        top:          -8,
        right:        -8,
        flexDirection:'row',
        alignItems:   'center',
        gap:          2,
        paddingHorizontal: 6,
        paddingVertical:   3,
        borderRadius: 8,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems:    'flex-start',
        gap:           8,
        padding:       10,
        borderRadius:  10,
        borderWidth:   1,
    },
    promptInput: {
        borderWidth:  1,
        borderRadius: 14,
        padding:      14,
        fontSize:     13,
        minHeight:    200,
        lineHeight:   20,
    },
    charCount: {
        borderTopWidth: 1,
        paddingTop:     8,
    },
    clearBtn: {
        padding: 4,
    },
    saveBtn: {
        flexDirection:  'row',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            8,
        padding:        16,
        borderRadius:   16,
    },
});