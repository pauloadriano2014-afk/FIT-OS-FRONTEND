// src/components/Admin/TabGestao.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TabFerramentas from './TabFerramentas';
import TabConfig from './TabConfig';
import TabSaaS from './TabSaaS';
import TabMarca from './TabMarca';
import TabIA from './TabIA';
import TabAssinatura from './TabAssinatura';
import TabPropostaOfertas from './TabPropostaOfertas'; // 💎 Ofertas de Proposta (só master)
import TabDesafios from './TabDesafios'; // 🎯 Desafios/Projetos por WhatsApp (só master)

const MASTER_IDS = [
    '3c82f763-66b4-48da-836e-16817d4f57c0', // Paulo
    'b7c0c181-41fd-4156-b8fe-963a267759a3'  // Adri
];

export default function TabGestao({ 
    theme, subTabGestao, setSubTabGestao, navigation, alunosAtivos, 
    setIsNpsModalOpen, setIsNoticeModalOpen, toggleDarkMode,
    selectThemeColor, selectedColor
}) {
    const [currentUserId, setCurrentUserId] = useState(null);
    const { width } = useWindowDimensions();
    
    // Identifica se está no celular (ou tela estreita)
    const isMobile = Platform.OS !== 'web' || width <= 768;

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    setCurrentUserId(JSON.parse(userStr).id);
                }
            } catch (e) { console.log("Erro ao carregar ID de usuário:", e); }
        };
        loadUser();
    }, []);

    const isMasterCoach = MASTER_IDS.includes(currentUserId);
    const flixName = isMasterCoach ? 'PA FLIX' : 'ELITE FLIX';

    // Array inteligente de abas (Filtra automaticamente o que cada um pode ver)
    // 🔑 A aba "VENDAS" agora é sempre visível — o conteúdo renderizado
    // dentro dela é que muda conforme o papel (master vê Ofertas de
    // Proposta; parceiro vê o construtor de página SaaS dele).
    const TABS = [
        { id: 'FERRAMENTAS', label: 'TREINO E DIETA',   show: true },
        { id: 'CONFIG',      label: 'SISTEMA E AVISOS', show: true },
        { id: 'SAAS',        label: 'VENDAS',           show: true },
        { id: 'DESAFIOS',    label: 'DESAFIOS',         show: isMasterCoach },
        { id: 'IA',          label: 'MINHA IA',         show: !isMasterCoach },
        { id: 'MARCA',       label: 'MINHA MARCA',      show: true },
        { id: 'ASSINATURA',  label: 'MINHA ASSINATURA', show: !isMasterCoach }, 
    ].filter(tab => tab.show);

    const impersonateTestStudent = async () => {
        try {
            const currentAdminStr = await AsyncStorage.getItem('user');
            const currentRole = await AsyncStorage.getItem('role');
            
            if (!currentAdminStr || !currentUserId) {
                if (Platform.OS === 'web') window.alert("Erro: Sessão de admin não encontrada.");
                else Alert.alert("Erro", "Sessão de admin não encontrada.");
                return;
            }

            const executeImpersonation = async () => {
                try {
                    const apiUrl = `https://fitos-final.onrender.com/api/admin/impersonate?coachId=${currentUserId}`;
                    const res = await fetch(apiUrl);
                    
                    if (!res.ok) throw new Error("Erro na API");
                    
                    const testStudent = await res.json();
                    
                    await AsyncStorage.setItem('original_admin_user', currentAdminStr);
                    await AsyncStorage.setItem('original_admin_role', currentRole || 'ADMIN');
                    
                    await AsyncStorage.setItem('user', JSON.stringify(testStudent));
                    await AsyncStorage.setItem('role', 'USER');
                    
                    if (Platform.OS === 'web') {
                        window.location.replace('/');
                    } else {
                        navigation.reset({ index: 0, routes: [{ name: 'Main' }] }); 
                    }
                } catch (err) {
                    if (Platform.OS === 'web') window.alert("Falha ao conectar com o servidor. Tente novamente.");
                    else Alert.alert("Erro", "Falha ao conectar com o servidor. O login não foi efetuado.");
                }
            };

            if (Platform.OS === 'web') {
                if (window.confirm("Você entrará na visão do aluno fantasma. Para voltar ao painel Coach, clique no botão vermelho que aparecerá no app. Deseja entrar?")) {
                    executeImpersonation();
                }
            } else {
                Alert.alert(
                    "Visualizar como Aluno",
                    "Você entrará na visão do aluno fantasma. Para voltar, clique no botão vermelho na tela inicial.",
                    [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Entrar", onPress: executeImpersonation }
                    ]
                );
            }
        } catch (error) {
            console.log("Erro ao tentar visualizar como aluno:", error);
        }
    };

    // Renderizador dos Botões de Aba
    const renderTabButtons = () => (
        TABS.map(tab => {
            const isActive = subTabGestao === tab.id;
            return (
                <TouchableOpacity
                    key={tab.id}
                    style={[
                        styles.subTab,
                        !isMobile && { flex: 1 }, 
                        isMobile && { paddingHorizontal: 16 }, 
                        isActive
                            ? { backgroundColor: theme.surface, borderColor: theme.border }
                            : { borderColor: 'transparent' }
                    ]}
                    onPress={() => setSubTabGestao(tab.id)}
                >
                    <Text style={[styles.subTabText, { color: isActive ? theme.text : theme.textSecondary }]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            );
        })
    );

    return (
        <View style={styles.gridGestao}>
            
            {/* SELETOR DE ABAS DINÂMICO (Carrossel no Mobile, Grid no Desktop) */}
            {isMobile ? (
                <View style={{ marginHorizontal: -5 }}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollTabsContainer}
                        overScrollMode="never"
                        bounces={false}
                    >
                        {renderTabButtons()}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.subTabsContainer}>
                    {renderTabButtons()}
                </View>
            )}

            {/* BOTÃO VISUALIZAR COMO ALUNO */}
            <TouchableOpacity
                style={[styles.impersonateBtn, { backgroundColor: theme.accent, borderColor: theme.border }]}
                onPress={impersonateTestStudent}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="account-switch" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                <Text style={[styles.impersonateBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>
                    VISUALIZAR COMO ALUNO TESTE
                </Text>
            </TouchableOpacity>

            {/* CONTEÚDO DAS ABAS */}
            {subTabGestao === 'FERRAMENTAS' && (
                <TabFerramentas
                    isMasterCoach={isMasterCoach}
                    theme={theme}
                    navigation={navigation}
                    alunosAtivos={alunosAtivos}
                    currentUserId={currentUserId}
                />
            )}
            
            {subTabGestao === 'CONFIG' && (
                <TabConfig
                    isMasterCoach={isMasterCoach}
                    theme={theme}
                    navigation={navigation}
                    flixName={flixName}
                    setIsNpsModalOpen={setIsNpsModalOpen}
                    setIsNoticeModalOpen={setIsNoticeModalOpen}
                    toggleDarkMode={toggleDarkMode}
                    selectThemeColor={selectThemeColor}
                    selectedColor={selectedColor}
                />
            )}
            
            {/* 💎 Aba VENDAS — master vê Ofertas de Proposta, parceiro vê o SaaS dele */}
            {subTabGestao === 'SAAS' && (
                isMasterCoach
                    ? <TabPropostaOfertas theme={theme} currentUserId={currentUserId} navigation={navigation} />
                    : <TabSaaS theme={theme} currentUserId={currentUserId} />
            )}

            {/* 🎯 Aba DESAFIOS — só master */}
            {subTabGestao === 'DESAFIOS' && isMasterCoach && (
                <TabDesafios theme={theme} currentUserId={currentUserId} navigation={navigation} />
            )}
            
            {subTabGestao === 'IA' && !isMasterCoach && (
                <TabIA theme={theme} currentUserId={currentUserId} />
            )}
            
            {subTabGestao === 'MARCA' && (
                <TabMarca theme={theme} />
            )}

            {/* 🚀 ABA DE ASSINATURA REAL */}
            {subTabGestao === 'ASSINATURA' && !isMasterCoach && (
                <TabAssinatura theme={theme} currentUserId={currentUserId} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    gridGestao:          { gap: 15 },
    subTabsContainer:    { flexDirection: 'row', marginBottom: 10, gap: 10, flexWrap: 'wrap' },
    scrollTabsContainer: { paddingHorizontal: 5, paddingBottom: 10, gap: 8, flexDirection: 'row' },
    subTab:              { padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    subTabText:          { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    impersonateBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 5 },
    impersonateBtnText:  { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});