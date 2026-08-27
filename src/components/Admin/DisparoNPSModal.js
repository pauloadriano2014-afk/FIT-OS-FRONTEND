// src/components/Admin/DisparoNPSModal.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

export default function DisparoNPSModal({ visible, onClose, alunos, theme }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const filteredAlunos = useMemo(() => {
        return alunos.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()));
    }, [alunos, search]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const selectAll = () => {
        if (selectedIds.length === filteredAlunos.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredAlunos.map(a => a.id));
        }
    };

    const handleConfirm = async () => {
        if (selectedIds.length === 0) return;
        
        setLoading(true);
        try {
            // URL alinhada com a sua pasta 'user' no singular
            const res = await fetch('https://fitos-final.onrender.com/api/admin/user/mass-nps', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ studentIds: selectedIds })
            });
            if (res.ok) {
                Alert.alert("Sucesso", "A pesquisa NPS aparecerá para os alunos selecionados assim que eles abrirem o app!");
                setSelectedIds([]);
                onClose();
            } else {
                Alert.alert("Erro", "Falha ao enviar a solicitação.");
            }
        } catch (e) {
            Alert.alert("Erro", "Falha de conexão ao disparar pesquisas.");
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>DISPARAR PESQUISA (NPS)</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.text}/>
                        </TouchableOpacity>
                    </View>

                    <TextInput 
                        style={[styles.search, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]}
                        placeholder="Buscar aluno..." placeholderTextColor={theme.textSecondary}
                        value={search} onChangeText={setSearch}
                    />

                    <TouchableOpacity style={styles.selectAll} onPress={selectAll}>
                        <MaterialCommunityIcons 
                            name={selectedIds.length === filteredAlunos.length && filteredAlunos.length > 0 ? "checkbox-marked" : "checkbox-blank-outline"} 
                            size={22} color="#4DE38F" 
                        />
                        <Text style={styles.selectAllText}>
                            SELECIONAR TODOS ({filteredAlunos.length})
                        </Text>
                    </TouchableOpacity>

                    <FlatList 
                        data={filteredAlunos} 
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({item}) => (
                            <TouchableOpacity style={[styles.item, { borderBottomColor: theme.border }]} onPress={() => toggleSelect(item.id)}>
                                <MaterialCommunityIcons 
                                    name={selectedIds.includes(item.id) ? "checkbox-marked" : "checkbox-blank-outline"} 
                                    size={22} color={selectedIds.includes(item.id) ? "#4DE38F" : theme.textSecondary} 
                                />
                                <Text style={{color: theme.text, marginLeft: 12, fontSize: 14, fontWeight: 'bold'}}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>Nenhum aluno encontrado.</Text>}
                    />

                    <TouchableOpacity 
                        style={[styles.btn, { backgroundColor: selectedIds.length > 0 ? '#4DE38F' : theme.border }]} 
                        onPress={handleConfirm} disabled={loading || selectedIds.length === 0}
                    >
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={[styles.btnText, { color: selectedIds.length > 0 ? '#000' : theme.textSecondary }]}>ENVIAR PARA {selectedIds.length} ALUNOS</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
    content: { borderRadius: 24, borderWidth: 1, maxHeight: '85%', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
    search: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 15, fontSize: 14 },
    selectAll: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, paddingVertical: 5 },
    selectAllText: { color: '#4DE38F', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    btn: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
    btnText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 }
});