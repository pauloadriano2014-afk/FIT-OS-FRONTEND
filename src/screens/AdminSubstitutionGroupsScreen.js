// src/screens/AdminSubstitutionGroupsScreen.js
// Tela 1 — lista de grupos de substituição do coach
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList,
    ActivityIndicator, Modal, TextInput, Alert, Platform,
    SafeAreaView, useWindowDimensions, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

const BASE_URL = 'https://fitos-final.onrender.com';

// ─── MODAL CRIAR/EDITAR GRUPO ─────────────────────────────────────────────────
function GroupFormModal({ visible, onClose, onSave, editing, theme }) {
    const [name,        setName]        = useState('');
    const [description, setDescription] = useState('');
    const [saving,      setSaving]      = useState(false);

    useEffect(() => {
        if (visible) {
            setName(editing?.name ?? '');
            setDescription(editing?.description ?? '');
        }
    }, [visible, editing]);

    const handleSave = async () => {
        if (!name.trim()) return Alert.alert('Atenção', 'O nome do grupo é obrigatório.');
        setSaving(true);
        await onSave({ name: name.trim(), description: description.trim() });
        setSaving(false);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={[styles.formSheet, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <View style={styles.formHeader}>
                        <View>
                            <Text style={[styles.formTitle, { color: theme.text }]}>
                                {editing ? 'EDITAR GRUPO' : 'NOVO GRUPO'}
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>
                                Grupos organizam alimentos substituíveis entre si
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>NOME DO GRUPO *</Text>
                    <TextInput
                        style={[styles.formInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Ex: Carboidratos Base, Proteína Magra..."
                        placeholderTextColor={theme.textSecondary}
                    />

                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DESCRIÇÃO (opcional)</Text>
                    <TextInput
                        style={[styles.formInput, styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Ex: Carboidratos que podem substituir o arroz branco nas refeições principais"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={3}
                    />

                    {/* Explicação */}
                    <View style={[styles.infoCard, { backgroundColor: theme.accent + '10', borderColor: theme.accent + '30' }]}>
                        <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
                        <Text style={{ flex: 1, color: theme.textSecondary, fontSize: 12, lineHeight: 18 }}>
                            Após criar o grupo, você adiciona os alimentos membros. Quando montar uma dieta e usar um desses alimentos, os outros do mesmo grupo entrarão automaticamente como substitutos com quantidade equivalente em calorias.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: theme.accent, marginTop: 16 }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving
                            ? <ActivityIndicator color="#000" />
                            : <Text style={{ fontWeight: '900', fontSize: 14, color: '#000' }}>
                                {editing ? 'SALVAR ALTERAÇÕES' : 'CRIAR GRUPO'}
                              </Text>
                        }
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
export default function AdminSubstitutionGroupsScreen({ navigation }) {
    const { theme } = useTheme();
    const { height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const [coachId,      setCoachId]      = useState('');
    const [groups,       setGroups]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [formVisible,  setFormVisible]  = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    useEffect(() => {
        AsyncStorage.getItem('user').then(json => {
            if (json) {
                try { const u = JSON.parse(json); setCoachId(u.id ?? ''); } catch {}
            }
        });
    }, []);

    const fetchGroups = useCallback(async () => {
        if (!coachId) return;
        setLoading(true);
        try {
            const res  = await fetch(`${BASE_URL}/api/food/substitution-groups?coachId=${coachId}`, {
                headers: { ...(await authHeaders()) },
            });
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[SubstitutionGroups]', e);
        } finally {
            setLoading(false);
        }
    }, [coachId]);

    useEffect(() => { if (coachId) fetchGroups(); }, [coachId]);

    const handleSave = async ({ name, description }) => {
        try {
            if (editingGroup) {
                // Editar
                const res = await fetch(`${BASE_URL}/api/food/substitution-groups/${editingGroup.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({ coachId, name, description }),
                });
                if (!res.ok) throw new Error('Erro');
                const updated = await res.json();
                setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
            } else {
                // Criar
                const res = await fetch(`${BASE_URL}/api/food/substitution-groups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                    body: JSON.stringify({ coachId, name, description }),
                });
                if (!res.ok) throw new Error('Erro');
                const created = await res.json();
                setGroups(prev => [...prev, created]);
            }
            setFormVisible(false);
            setEditingGroup(null);
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar o grupo.');
        }
    };

    const handleDelete = (group) => {
        const msg = `Excluir o grupo "${group.name}"? Os alimentos não serão excluídos, apenas o grupo.`;
        const doDelete = async () => {
            try {
                const res = await fetch(`${BASE_URL}/api/food/substitution-groups/${group.id}?coachId=${coachId}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
                if (!res.ok) throw new Error('Erro');
                setGroups(prev => prev.filter(g => g.id !== group.id));
            } catch { Alert.alert('Erro', 'Não foi possível excluir.'); }
        };
        if (Platform.OS === 'web') { if (window.confirm(msg)) doDelete(); }
        else Alert.alert('Excluir grupo', msg, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: doDelete },
        ]);
    };

    const renderGroup = ({ item }) => (
        <TouchableOpacity
            style={[styles.groupCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate('AdminSubstitutionGroupDetailScreen', { group: item, coachId })}
            activeOpacity={0.8}
        >
            {/* Ícone */}
            <View style={[styles.groupIcon, { backgroundColor: theme.accent + '18' }]}>
                <MaterialCommunityIcons name="swap-horizontal" size={22} color={theme.accent} />
            </View>

            {/* Info */}
            <View style={{ flex: 1, paddingHorizontal: 14 }}>
                <Text style={[styles.groupName, { color: theme.text }]}>{item.name}</Text>
                {item.description ? (
                    <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2, lineHeight: 16 }} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <MaterialCommunityIcons name="food-apple" size={12} color={theme.accent} />
                    <Text style={{ color: theme.accent, fontSize: 11, fontWeight: '800' }}>
                        {item.memberCount} {item.memberCount === 1 ? 'alimento' : 'alimentos'}
                    </Text>
                </View>
            </View>

            {/* Ações */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                    onPress={() => { setEditingGroup(item); setFormVisible(true); }}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FF3B3010', borderColor: '#FF3B3030' }]}
                    onPress={() => handleDelete(item)}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const RootView = isWeb ? View : SafeAreaView;
    const rootStyle = isWeb
        ? { height: windowHeight, backgroundColor: theme.bg, display: 'flex', flexDirection: 'column' }
        : { flex: 1, backgroundColor: theme.bg };

    return (
        <RootView style={rootStyle}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}
                >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GRUPOS DE SUBSTITUIÇÃO</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'} criados
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => { setEditingGroup(null); setFormVisible(true); }}
                    style={[styles.iconBtn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                >
                    <MaterialCommunityIcons name="plus" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            {/* EXPLICAÇÃO PRINCIPAL */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <View style={[styles.explainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.explainIconBox, { backgroundColor: theme.accent + '18' }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={24} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                        <Text style={[styles.explainTitle, { color: theme.text }]}>O que são Grupos de Substituição?</Text>
                        <Text style={[styles.explainText, { color: theme.textSecondary }]}>
                            São conjuntos de alimentos que podem se substituir em uma refeição.
                            Quando você monta uma dieta e adiciona um alimento que pertence a um grupo, os outros membros entram automaticamente como opções substitutas — já com a quantidade ajustada para ter as mesmas calorias.
                        </Text>
                        <Text style={[styles.explainExample, { color: theme.accent }]}>
                            Exemplo: Arroz → substitutos automáticos: Batata Doce, Macarrão, Mandioca
                        </Text>
                    </View>
                </View>
            </View>

            {/* LISTA */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <FlatList
                    data={groups}
                    keyExtractor={item => item.id}
                    renderItem={renderGroup}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={{ alignItems: 'center', padding: 48 }}>
                            <MaterialCommunityIcons name="swap-horizontal" size={56} color={theme.textSecondary} />
                            <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginTop: 16 }}>
                                Nenhum grupo ainda
                            </Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                                Crie grupos para que o sistema adicione substitutos automaticamente quando você montar dietas.
                            </Text>
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.accent, marginTop: 24, paddingHorizontal: 32 }]}
                                onPress={() => { setEditingGroup(null); setFormVisible(true); }}
                            >
                                <Text style={{ fontWeight: '900', color: '#000', fontSize: 14 }}>+ CRIAR PRIMEIRO GRUPO</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            <GroupFormModal
                visible={formVisible}
                onClose={() => { setFormVisible(false); setEditingGroup(null); }}
                onSave={handleSave}
                editing={editingGroup}
                theme={theme}
            />
        </RootView>
    );
}

const styles = StyleSheet.create({
    header:        { flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1 },
    iconBtn:       { padding:9, borderRadius:14, borderWidth:1 },
    headerTitle:   { fontWeight:'900', fontSize:13, letterSpacing:1.5 },
    explainCard:   { flexDirection:'row', padding:16, borderRadius:20, borderWidth:1 },
    explainIconBox:{ width:48, height:48, borderRadius:14, alignItems:'center', justifyContent:'center', alignSelf:'flex-start' },
    explainTitle:  { fontSize:13, fontWeight:'900', marginBottom:6 },
    explainText:   { fontSize:12, lineHeight:18, marginBottom:6 },
    explainExample:{ fontSize:11, fontWeight:'800', fontStyle:'italic' },
    groupCard:     { flexDirection:'row', alignItems:'center', padding:16, borderRadius:18, borderWidth:1, marginBottom:12 },
    groupIcon:     { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
    groupName:     { fontSize:15, fontWeight:'900' },
    actionBtn:     { width:34, height:34, borderRadius:10, borderWidth:1, alignItems:'center', justifyContent:'center' },
    infoCard:      { flexDirection:'row', alignItems:'flex-start', gap:8, padding:12, borderRadius:12, borderWidth:1 },
    fieldLabel:    { fontSize:11, fontWeight:'800', marginBottom:5, letterSpacing:0.5 },
    formInput:     { borderWidth:1, borderRadius:12, padding:14, fontSize:14, marginBottom:14 },
    textArea:      { height:80, textAlignVertical:'top' },
    saveBtn:       { padding:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
    modalBackdrop: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    formSheet:     { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:24, maxHeight:'90%' },
    formHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
    formTitle:     { fontSize:16, fontWeight:'900', letterSpacing:1 },
});