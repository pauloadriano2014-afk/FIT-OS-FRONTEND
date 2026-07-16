// src/components/Admin/TabGestao.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importa os sub-componentes que criamos
import TabFerramentas from './TabFerramentas';
import TabConfig from './TabConfig';
import TabSaaS from './TabSaaS';
import TabMarca from './TabMarca';

const MASTER_IDS = [
    '3c82f763-66b4-48da-836e-16817d4f57c0', // Paulo
    'b7c0c181-41fd-4156-b8fe-963a267759a3'  // Adri
];

export default function TabGestao({ 
    theme, subTabGestao, setSubTabGestao, navigation, alunosAtivos, 
    setIsNpsModalOpen, setIsNoticeModalOpen, toggleDarkMode 
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

    return (
        <View style={styles.gridGestao}>
            {/* SELETOR DE ABAS */}
            <View style={styles.subTabsContainer}>
                <TouchableOpacity style={[styles.subTab, subTabGestao === 'FERRAMENTAS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('FERRAMENTAS')}>
                    <Text style={[styles.subTabText, { color: subTabGestao === 'FERRAMENTAS' ? theme.text : theme.textSecondary }]}>TREINO E DIETA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.subTab, subTabGestao === 'CONFIG' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('CONFIG')}>
                    <Text style={[styles.subTabText, { color: subTabGestao === 'CONFIG' ? theme.text : theme.textSecondary }]}>SISTEMA E AVISOS</Text>
                </TouchableOpacity>
                
                {!isMasterCoach && (
                    <TouchableOpacity style={[styles.subTab, subTabGestao === 'SAAS' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('SAAS')}>
                        <Text style={[styles.subTabText, { color: subTabGestao === 'SAAS' ? theme.text : theme.textSecondary }]}>VENDAS</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.subTab, subTabGestao === 'MARCA' ? { backgroundColor: theme.surface, borderColor: theme.border } : { borderColor: 'transparent' }]} onPress={() => setSubTabGestao('MARCA')}>
                    <Text style={[styles.subTabText, { color: subTabGestao === 'MARCA' ? theme.text : theme.textSecondary }]}>MINHA MARCA</Text>
                </TouchableOpacity>
            </View>

            {/* CONTEÚDO DAS ABAS (MODULARIZADO) */}
            {subTabGestao === 'FERRAMENTAS' && <TabFerramentas isMasterCoach={isMasterCoach} theme={theme} navigation={navigation} alunosAtivos={alunosAtivos} />}
            {subTabGestao === 'CONFIG' && <TabConfig isMasterCoach={isMasterCoach} theme={theme} navigation={navigation} flixName={flixName} setIsNpsModalOpen={setIsNpsModalOpen} setIsNoticeModalOpen={setIsNoticeModalOpen} toggleDarkMode={toggleDarkMode} />}
            {subTabGestao === 'SAAS' && !isMasterCoach && <TabSaaS theme={theme} currentUserId={currentUserId} />}
            {subTabGestao === 'MARCA' && <TabMarca theme={theme} />}
        </View>
    );
}

const styles = StyleSheet.create({
    gridGestao: { gap: 15 },
    subTabsContainer: { flexDirection: 'row', marginBottom: 15, gap: 10 },
    subTab: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' }, 
    subTabText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center' },
});