// src/components/Admin/TabGestao.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TabFerramentas from './TabFerramentas';
import TabConfig from './TabConfig';
import TabSaaS from './TabSaaS';
import TabMarca from './TabMarca';
import TabIA from './TabIA'; // ← NOVO

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

    return (
        <View style={styles.gridGestao}>
            {/* SELETOR DE ABAS */}
            <View style={styles.subTabsContainer}>
                <TouchableOpacity
                    style={[styles.subTab, subTabGestao === 'FERRAMENTAS'
                        ? { backgroundColor: theme.surface, borderColor: theme.border }
                        : { borderColor: 'transparent' }
                    ]}
                    onPress={() => setSubTabGestao('FERRAMENTAS')}
                >
                    <Text style={[styles.subTabText, { color: subTabGestao === 'FERRAMENTAS' ? theme.text : theme.textSecondary }]}>
                        TREINO E DIETA
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.subTab, subTabGestao === 'CONFIG'
                        ? { backgroundColor: theme.surface, borderColor: theme.border }
                        : { borderColor: 'transparent' }
                    ]}
                    onPress={() => setSubTabGestao('CONFIG')}
                >
                    <Text style={[styles.subTabText, { color: subTabGestao === 'CONFIG' ? theme.text : theme.textSecondary }]}>
                        SISTEMA E AVISOS
                    </Text>
                </TouchableOpacity>

                {/* VENDAS — só parceiro */}
                {!isMasterCoach && (
                    <TouchableOpacity
                        style={[styles.subTab, subTabGestao === 'SAAS'
                            ? { backgroundColor: theme.surface, borderColor: theme.border }
                            : { borderColor: 'transparent' }
                        ]}
                        onPress={() => setSubTabGestao('SAAS')}
                    >
                        <Text style={[styles.subTabText, { color: subTabGestao === 'SAAS' ? theme.text : theme.textSecondary }]}>
                            VENDAS
                        </Text>
                    </TouchableOpacity>
                )}

                {/* MINHA IA — só parceiro ← NOVO */}
                {!isMasterCoach && (
                    <TouchableOpacity
                        style={[styles.subTab, subTabGestao === 'IA'
                            ? { backgroundColor: theme.surface, borderColor: theme.border }
                            : { borderColor: 'transparent' }
                        ]}
                        onPress={() => setSubTabGestao('IA')}
                    >
                        <Text style={[styles.subTabText, { color: subTabGestao === 'IA' ? theme.text : theme.textSecondary }]}>
                            MINHA IA
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.subTab, subTabGestao === 'MARCA'
                        ? { backgroundColor: theme.surface, borderColor: theme.border }
                        : { borderColor: 'transparent' }
                    ]}
                    onPress={() => setSubTabGestao('MARCA')}
                >
                    <Text style={[styles.subTabText, { color: subTabGestao === 'MARCA' ? theme.text : theme.textSecondary }]}>
                        MINHA MARCA
                    </Text>
                </TouchableOpacity>
            </View>

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
            {subTabGestao === 'SAAS' && !isMasterCoach && (
                <TabSaaS theme={theme} currentUserId={currentUserId} />
            )}
            {/* MINHA IA — só parceiro ← NOVO */}
            {subTabGestao === 'IA' && !isMasterCoach && (
                <TabIA theme={theme} currentUserId={currentUserId} />
            )}
            {subTabGestao === 'MARCA' && (
                <TabMarca theme={theme} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    gridGestao:        { gap: 15 },
    subTabsContainer:  { flexDirection: 'row', marginBottom: 10, gap: 10, flexWrap: 'wrap' },
    subTab:            { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    subTabText:        { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
    impersonateBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 5 },
    impersonateBtnText:{ fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});