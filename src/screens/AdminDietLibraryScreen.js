// src/screens/AdminDietLibraryScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity, 
    FlatList, ActivityIndicator, Platform, Alert, useWindowDimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminDietLibraryScreen({ navigation }) {
    const { theme } = useTheme();
    const isWeb = Platform.OS === 'web';
    const { height: windowHeight } = useWindowDimensions();
    const RootComponent = isWeb ? View : SafeAreaView;

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/diet-templates?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error("Erro ao buscar templates:", error);
            if (Platform.OS !== 'web') Alert.alert('Erro', 'Não foi possível carregar a biblioteca.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTemplates();
    };

    const handleDelete = async (id, name) => {
        const confirmDelete = async () => {
            try {
                const res = await fetch(`https://fitos-final.onrender.com/api/admin/diet-templates?id=${id}`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    setTemplates(prev => prev.filter(t => t.id !== id));
                    if (Platform.OS === 'web') window.alert('Template excluído.');
                }
            } catch (error) {
                if (Platform.OS !== 'web') Alert.alert('Erro', 'Falha ao excluir o template.');
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Tem certeza que deseja excluir o template "${name}"?`)) {
                confirmDelete();
            }
        } else {
            Alert.alert(
                "Excluir Template",
                `Tem certeza que deseja excluir o template "${name}"?`,
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Excluir", style: "destructive", onPress: confirmDelete }
                ]
            );
        }
    };

    const renderTemplateCard = ({ item }) => {
        const parsedMeals = typeof item.meals === 'string' ? JSON.parse(item.meals) : item.meals;
        const mealCount = parsedMeals?.length || 0;
        
        // Descobre de qual "Dia" esse template foi salvo
        const sourceDay = parsedMeals?.[0]?.dayType || 'TREINO';

        return (
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: 'bold' }}>
                                {item.totalKcal ? `${Math.round(item.totalKcal)} kcal` : 'Macros Variados'}
                            </Text>
                            <Text style={{ color: theme.border }}>•</Text>
                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{mealCount} Refeições</Text>
                            <Text style={{ color: theme.border }}>•</Text>
                            {/* Mostra de onde a base veio */}
                            <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold' }}>Origem: {sourceDay}</Text>
                        </View>
                    </View>
                    <View style={[styles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="food-apple-outline" size={24} color={theme.accent} />
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.cardActions}>
                    <Text style={{ color: theme.textSecondary, fontSize: 10, fontStyle: 'italic' }}>
                        Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </Text>
                    <TouchableOpacity 
                        style={[styles.deleteBtn, { backgroundColor: '#FF3B3015' }]} 
                        onPress={() => handleDelete(item.id, item.name)}
                    >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                        <Text style={styles.deleteBtnText}>Excluir</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <RootComponent style={{ flex: 1, backgroundColor: isWeb ? (theme.isDark ? '#0a0a0a' : '#E5E5EA') : theme.bg }}>
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 600 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) }}>
                
                {/* HEADER */}
                <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>BIBLIOTECA DE DIETAS</Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 11, marginTop: 2 }}>Seu Cofre de Templates</Text>
                    </View>
                    <View style={{ width: 40 }} /> {/* Spacer */}
                </View>

                <View style={styles.content}>
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10, fontWeight: 'bold' }}>Abrindo o cofre...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.infoBanner}>
                                <MaterialCommunityIcons name="information-outline" size={20} color={theme.accent} />
                                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                                    Para criar um novo template, monte a dieta na Mesa de Operações de qualquer aluno (ou de um aluno "Teste") e clique no botão <Text style={{fontWeight: 'bold', color: theme.text}}>SALVAR TEMPLATE</Text>.
                                </Text>
                            </View>

                            <FlatList
                                data={templates}
                                keyExtractor={item => item.id}
                                renderItem={renderTemplateCard}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                                onRefresh={onRefresh}
                                refreshing={refreshing}
                                ListEmptyComponent={
                                    <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                        <View style={[styles.emptyIconBg, { backgroundColor: theme.surface }]}>
                                            <MaterialCommunityIcons name="folder-open-outline" size={32} color={theme.textSecondary} />
                                        </View>
                                        <Text style={[styles.emptyTitle, { color: theme.text }]}>Cofre Vazio</Text>
                                        <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Você ainda não salvou nenhum modelo de dieta.</Text>
                                    </View>
                                }
                            />
                        </>
                    )}
                </View>

            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center', borderBottomWidth: 1, elevation: 5, zIndex: 10 },
    iconBtn: { padding: 9, borderRadius: 14, borderWidth: 1 },
    headerTitle: { fontWeight: '900', fontSize: 13, letterSpacing: 1.5 },
    content: { flex: 1, padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#4DE38F10', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#4DE38F30', marginBottom: 20 },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

    card: { borderRadius: 16, borderWidth: 1, marginBottom: 15, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
    iconBox: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, marginVertical: 15 },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    deleteBtnText: { color: '#FF3B30', fontSize: 11, fontWeight: 'bold' },

    emptyBox: { alignItems: 'center', padding: 40, borderStyle: 'dashed', borderWidth: 1, borderRadius: 24, marginTop: 20 },
    emptyIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    emptyTitle: { fontSize: 16, fontWeight: '900' },
    emptyDesc: { fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});