// src/components/ImpersonateExitButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ImpersonateExitButton({ navigation }) {
    const [isImpersonating, setIsImpersonating] = useState(false);

    useEffect(() => {
        const checkImpersonation = async () => {
            try {
                const originalAdmin = await AsyncStorage.getItem('original_admin_user');
                if (originalAdmin) {
                    JSON.parse(originalAdmin);
                    setIsImpersonating(true);
                } else {
                    setIsImpersonating(false);
                }
            } catch (e) {
                console.error("Erro na validação de segurança do impersonate", e);
                await AsyncStorage.multiRemove(['original_admin_user', 'original_admin_role']);
                setIsImpersonating(false);
            }
        };
        checkImpersonation();
    }, []);

    const handleStopImpersonating = async () => {
        try {
            const originalUserStr = await AsyncStorage.getItem('original_admin_user');
            const originalRole = await AsyncStorage.getItem('original_admin_role');

            if (originalUserStr) {
                const adminData = JSON.parse(originalUserStr);
                
                const confirmAction = async () => {
                    await AsyncStorage.setItem('user', originalUserStr);
                    await AsyncStorage.setItem('role', originalRole || 'ADMIN');
                    await AsyncStorage.multiRemove(['original_admin_user', 'original_admin_role']);

                    if (Platform.OS === 'web') {
                        window.location.replace('/admin'); 
                    } else {
                        navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
                    }
                };

                if (Platform.OS === 'web') {
                    if (window.confirm(`Deseja encerrar a visualização e voltar para o painel de ${adminData.name || 'Coach'}?`)) {
                        confirmAction();
                    }
                } else {
                    Alert.alert(
                        "Encerrar Visualização",
                        `Deseja voltar para o painel de ${adminData.name || 'Coach'}?`,
                        [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Sim, Voltar", onPress: confirmAction }
                        ]
                    );
                }
            } else {
                await AsyncStorage.multiRemove(['original_admin_user', 'original_admin_role']);
                setIsImpersonating(false);
            }
        } catch (e) {
            console.log("Erro ao restaurar admin:", e);
            await AsyncStorage.multiRemove(['original_admin_user', 'original_admin_role']);
            setIsImpersonating(false);
        }
    };

    if (!isImpersonating) return null;

    return (
        <TouchableOpacity
            style={[styles.btnStopImpersonating, { shadowColor: '#FF3B30', marginTop: 10 }]}
            onPress={handleStopImpersonating}
            activeOpacity={0.8}
        >
            <MaterialCommunityIcons name="logout-variant" size={20} color="#FFF" />
            <Text style={styles.btnStopImpersonatingText}>VOLTAR PARA O PAINEL COACH</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btnStopImpersonating: { backgroundColor: '#FF3B30', padding: 16, marginBottom: 20, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    btnStopImpersonatingText: { color: '#FFF', fontWeight: '900', marginLeft: 10, fontSize: 13, letterSpacing: 0.5 },
});