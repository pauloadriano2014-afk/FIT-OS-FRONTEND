// src/screens/InstallScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
// 🔥 O listener do beforeinstallprompt agora mora num módulo importado de
// forma estática (não-lazy) no topo do App.js — ver src/utils/pwaInstall.js.
// Isso evita perder o evento quando essa tela é carregada via React.lazy().
import { getInstallPrompt, clearInstallPrompt, isStandalone, getPlatformInstallInfo } from '../utils/pwaInstall';

export default function InstallScreen({ navigation, route }) {
    const { theme } = useTheme();
    const [isIOS, setIsIOS] = useState(false);
    const [isChromeIOS, setIsChromeIOS] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    // 🔥 DEEP LINKING MÁGICO: Se ele acessou pelo link de convite (/registro?coach=XXX), 
    // nós guardamos o destino final para onde ele tem que ir depois de instalar.
    const isRegisterLink = route.name === 'Install' && route.params?.coach;
    const nextRoute = isRegisterLink ? 'Register' : 'Login';
    const nextParams = isRegisterLink ? { coach: route.params?.coach, plan: route.params?.plan } : {};

    useEffect(() => {
        const checkInstallStatus = async () => {
            if (Platform.OS === 'web') {
                try {
                    // 🔥 MEMÓRIA PERMANENTE: Verifica se o usuário já pulou/instalou antes
                    const dismissed = await AsyncStorage.getItem('@install_screen_dismissed');

                    // SE JÁ ESTIVER INSTALADO OU JÁ TIVER PULADO ANTES, PULA ESSA TELA DIRETO!
                    // (Se pular por engano ou o app não tiver sido instalado de verdade,
                    // ainda dá pra instalar depois pelo botão em Perfil > Instalar aplicativo.)
                    if (isStandalone() || dismissed === 'true') {
                        navigation.replace(nextRoute, nextParams);
                        return;
                    }

                    const { isIOS: ios, isChromeIOS: chromeIOS } = getPlatformInstallInfo();
                    setIsIOS(ios);
                    setIsChromeIOS(chromeIOS);
                } catch(e) {
                    console.error("Erro ao ler AsyncStorage na InstallScreen:", e);
                }
            } else {
                // Se for aplicativo nativo rodando (App Store/Play Store), pula também
                navigation.replace(nextRoute, nextParams);
            }
        };

        checkInstallStatus();
    }, []);

    const saveInstallStateAndProceed = async () => {
        try {
            await AsyncStorage.setItem('@install_screen_dismissed', 'true');
        } catch(e) {}
        navigation.replace(nextRoute, nextParams);
    };

    const handleInstallClick = async () => {
        const prompt = getInstallPrompt();
        if (prompt) {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            if (outcome === 'accepted') {
                clearInstallPrompt();
                saveInstallStateAndProceed();
                return;
            }
        }
        // Se for iOS, ou o Android não gerou o prompt automático (ou o usuário
        // recusou), mostra as instruções manuais.
        setShowInstructions(true);
    };

    const handleSkip = () => {
        saveInstallStateAndProceed();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={styles.content}>
                
                <View style={styles.brandContainer}>
                    <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
                    <Text style={[styles.title, { color: theme.text }]}>SUA CONSULTORIA DE ELITE</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Para ter a melhor experiência e não perder seus treinos, instale o aplicativo oficial no seu celular.
                    </Text>
                </View>

                {showInstructions ? (
                    <View style={[styles.instructionBox, { backgroundColor: theme.surface, borderColor: theme.accent }]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10}}>
                            <MaterialCommunityIcons name="cellphone-arrow-down" size={24} color={theme.accent} />
                            <Text style={[styles.instructionTitle, {color: theme.accent}]}>COMO INSTALAR:</Text>
                        </View>
                        
                        {isIOS ? (
                            isChromeIOS ? (
                                <Text style={[styles.instructionText, {color: theme.text}]}>
                                    1. Toque em Compartilhar <MaterialCommunityIcons name="export-variant" size={16} color={theme.textSecondary} /> no topo.{'\n'}
                                    2. Vá em "Ver mais" <MaterialCommunityIcons name="dots-horizontal" size={16} color={theme.textSecondary} />.{'\n'}
                                    3. Selecione "Adicionar à Tela de Início" <MaterialCommunityIcons name="plus-box-outline" size={16} color={theme.textSecondary} />.
                                </Text>
                            ) : (
                                <Text style={[styles.instructionText, {color: theme.text}]}>
                                    1. Toque no botão de Compartilhar <MaterialCommunityIcons name="export-variant" size={16} color={theme.textSecondary} /> na barra inferior.{'\n'}
                                    2. Role para baixo e selecione "Adicionar à Tela de Início" <MaterialCommunityIcons name="plus-box-outline" size={16} color={theme.textSecondary} />.
                                </Text>
                            )
                        ) : (
                            <Text style={[styles.instructionText, {color: theme.text}]}>
                                1. Clique nos 3 pontinhos <MaterialCommunityIcons name="dots-vertical" size={16} color={theme.textSecondary} /> do navegador.{'\n'}
                                2. Selecione "Instalar Aplicativo" ou "Adicionar à Tela Inicial".
                            </Text>
                        )}
                    </View>
                ) : (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={[styles.installBtn, { backgroundColor: theme.accent }]} onPress={handleInstallClick}>
                            <MaterialCommunityIcons name="download" size={24} color={theme.isDark ? '#000' : '#FFF'} />
                            <Text style={[styles.installBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>INSTALAR APLICATIVO</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={[styles.skipText, { color: theme.textSecondary }]}>Já instalei ou prefiro usar no navegador</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
    brandContainer: { alignItems: 'center', marginBottom: 40 },
    logoImage: { width: 180, height: 180, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
    actionContainer: { width: '100%', marginBottom: 30 },
    installBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10, elevation: 5 },
    installBtnText: { fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    instructionBox: { width: '100%', padding: 25, borderRadius: 16, borderWidth: 2, marginBottom: 30 },
    instructionTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
    instructionText: { fontSize: 14, lineHeight: 28, fontWeight: '600' },
    skipBtn: { padding: 15 },
    skipText: { fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' }
});