// src/screens/PDFViewerScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function PDFViewerScreen({ route, navigation }) {
    const { url, title } = route.params;
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);

    const isWeb = Platform.OS === 'web';
    const RootComponent = isWeb ? View : SafeAreaView;
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

    // 🔥 INTELIGÊNCIA ANTI-BLOQUEIO DO GOOGLE DRIVE
    let viewerUrl = url;
    if (url) {
        if (url.includes('drive.google.com')) {
            const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch && driveMatch[1]) {
                // ?rm=minimal tenta esconder barras nativamente
                viewerUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview?rm=minimal`;
            }
        } else if (url.endsWith('.pdf')) {
            viewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
        }
    }

    // 🔥 SCRIPT ANTI-PIRATARIA (Injetado dentro do PDF)
    // Ele "caça" o botão de "Outra janela/Pop-out" e destrói ele no momento que carrega
    const INJECTED_JAVASCRIPT = `
        const hideAntiPiracyUI = () => {
            // Procura os botões que permitem baixar/abrir fora
            const badButtons = document.querySelectorAll('[title*="Outra janela"], [aria-label*="Outra janela"], [title*="Pop-out"], [title*="download"]');
            badButtons.forEach(btn => btn.style.display = 'none');
            
            // Tenta esconder a barra de topo escura inteira do Google Drive
            const topBar = document.querySelector('.ndfHFb-c4YZDc-Wrql6b');
            if (topBar) topBar.style.display = 'none';
        };
        
        hideAntiPiracyUI();
        setInterval(hideAntiPiracyUI, 500); // Fica de vigia a cada meio segundo
        true;
    `;

    return (
        <RootComponent style={[styles.container, { backgroundColor: isWeb ? webOuterBg : theme.bg }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title || 'Lendo E-book'}</Text>
                    <View style={{ width: 40 }} /> 
                </View>

                <View style={{ flex: 1, position: 'relative' }}>
                    {loading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={theme.accent} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10, fontWeight: 'bold' }}>Blindando E-book...</Text>
                        </View>
                    )}
                    
                    {/* 🔥 ESCUDO FÍSICO ANTI-CLIQUE (Fica por cima do botão) */}
                    <View style={styles.antiPiracyShield} />

                    {isWeb ? (
                        <iframe src={viewerUrl} style={{ width: '100%', height: '100%', border: 'none' }} onLoad={() => setLoading(false)} />
                    ) : (
                        <WebView 
                            source={{ uri: viewerUrl }}
                            style={{ flex: 1, backgroundColor: theme.bg }}
                            onLoadEnd={() => setLoading(false)}
                            scalesPageToFit={true}
                            showsVerticalScrollIndicator={false}
                            injectedJavaScript={INJECTED_JAVASCRIPT}
                            javaScriptEnabled={true}
                        />
                    )}
                </View>

            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15 },
    backBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
    title: { fontSize: 16, fontWeight: '900', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    loaderContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    
    // 🔥 O ESCUDO: Fica transparente no canto superior direito, impedindo que o toque chegue no botão do Google
    antiPiracyShield: { position: 'absolute', top: 0, right: 0, width: 70, height: 70, backgroundColor: 'transparent', zIndex: 999 }
});