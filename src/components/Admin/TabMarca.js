// src/components/Admin/TabMarca.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../../utils/authToken';

export default function TabMarca({ theme }) {
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoUrl, setLogoUrl] = useState(null);
    const [logoSize, setLogoSize] = useState(220);
    const [savingBrand, setSavingBrand] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const loadInitialBrand = async () => {
            try {
                const userStr = await AsyncStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setCurrentUserId(user.id);
                    if (user.brandLogoUrl) setLogoUrl(user.brandLogoUrl);
                    if (user.brandLogoSize) setLogoSize(Number(user.brandLogoSize)); 
                }
            } catch (e) {
                console.log("Erro ao carregar marca salva:", e);
            }
        };
        loadInitialBrand();
    }, []);

    const uploadImageToR2 = async (uri, isSquare = true) => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') throw new Error('Sem permissão de galeria');
        }
        let formData = new FormData();
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileType = blob.type || 'image/jpeg';
            const file = new File([blob], `upload_${Date.now()}.jpg`, { type: fileType });
            formData.append('file', file);
        } else {
            const uriParts = uri.split('.');
            const fileType = uriParts[uriParts.length - 1] || 'jpg';
            formData.append('file', { uri: uri, name: `upload_${Date.now()}.${fileType}`, type: `image/${fileType}` });
        }
        const res = await fetch('https://fitos-final.onrender.com/api/upload-image', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no upload');
        return data.url;
    };

    const handlePickLogo = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ 
                mediaTypes: ['images'], 
                allowsEditing: true, 
                aspect: [3, 1], 
                quality: 0.8 
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                setUploadingLogo(true);
                const url = await uploadImageToR2(result.assets[0].uri, false);
                setLogoUrl(url);
            }
        } catch (error) { 
            console.log("Erro no picker: ", error);
            Alert.alert("Erro", "Falha ao enviar a imagem."); 
        } finally { 
            setUploadingLogo(false); 
        }
    };

    const handleSaveBrand = async () => {
        setSavingBrand(true);
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/admin/white-label', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ coachId: currentUserId, brandLogoUrl: logoUrl, brandLogoSize: logoSize })
            });
            if (res.ok) {
                const data = await res.json();
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                Alert.alert("Sucesso", "Sua marca e identidades foram atualizadas!");
            }
        } catch (error) { Alert.alert("Erro", "Não foi possível salvar a marca."); } finally { setSavingBrand(false); }
    };

    return (
        <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: 25 }]}>
            <View style={[styles.iconCircle, {backgroundColor: theme.accent + '22'}]}><MaterialCommunityIcons name="palette-swatch" size={32} color={theme.accent} /></View>
            <Text style={[styles.bigCardTitle, { color: theme.text }]}>IDENTIDADE VISUAL</Text>
            <Text style={[styles.bigCardDesc, { marginBottom: 20 }]}>Personalize a interface enviando a logomarca da sua consultoria. Ela aparecerá no rodapé do app do seu aluno e nas laterais do seu painel gerencial.</Text>

            <View style={{ width: '100%', backgroundColor: theme.bg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.cardHeaderSmall, { marginBottom: 10, textAlign: 'center' }]}>SUA LOGOMARCA</Text>
                <View style={[styles.logoPreviewBox, { borderColor: theme.border }]}>
                    {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" /> : <MaterialCommunityIcons name="image-outline" size={40} color={theme.textSecondary} />}
                </View>
                <Text style={{ fontSize: 11, color: theme.textSecondary, textAlign: 'center', marginBottom: 15, paddingHorizontal: 10 }}>Formato ideal: <Text style={{fontWeight: 'bold', color: theme.text}}>PNG Transparente</Text> horizontal. Tamanho máx: 2MB.</Text>
                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.surface, borderColor: theme.accent }]} onPress={handlePickLogo} disabled={uploadingLogo}>
                    {uploadingLogo ? <ActivityIndicator color={theme.accent} /> : <><MaterialCommunityIcons name="cloud-upload" size={20} color={theme.accent} /><Text style={[styles.uploadBtnText, { color: theme.accent }]}>ESCOLHER ARQUIVO</Text></>}
                </TouchableOpacity>
            </View>

            <View style={{ width: '100%', backgroundColor: theme.bg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.cardHeaderSmall, { marginBottom: 15, textAlign: 'center' }]}>LARGURA DA LOGO NO RODAPÉ</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <TouchableOpacity onPress={() => setLogoSize(prev => Math.max(100, prev - 15))} style={[styles.sizeAdjustmentBtn, { borderColor: theme.accent }]}><MaterialCommunityIcons name="minus" size={22} color={theme.accent} /></TouchableOpacity>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', minWidth: 60, textAlign: 'center' }}>{logoSize}px</Text>
                    <TouchableOpacity onPress={() => setLogoSize(prev => Math.min(500, prev + 15))} style={[styles.sizeAdjustmentBtn, { borderColor: theme.accent }]}><MaterialCommunityIcons name="plus" size={22} color={theme.accent} /></TouchableOpacity>
                </View>
            </View>

            {/* MOCKUP DESKTOP (PAINEL ADMIN) */}
            <View style={{ width: '100%', backgroundColor: theme.bg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.cardHeaderSmall, { marginBottom: 15, textAlign: 'center' }]}>COMO VOCÊ VERÁ O PAINEL (PC / WEB):</Text>
                <View style={[styles.mockupDesktop, { borderColor: theme.border }]}>
                    {/* Lateral Esquerda */}
                    <View style={styles.mockupLateral}>
                        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.mockupLateralLogo} resizeMode="contain" /> : <MaterialCommunityIcons name="image-outline" size={30} color="#333" />}
                    </View>

                    {/* Centro (Dashboard) */}
                    <View style={[styles.mockupCenter, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderBottomWidth: 1, borderColor: theme.border }}>
                            <View style={{ width: 40, height: 8, backgroundColor: theme.border, borderRadius: 4 }} />
                            <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: theme.border }} />
                        </View>
                        <View style={{ margin: 10, height: 50, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#222' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="rocket-launch" size={14} color="#4DE38F" style={{ marginRight: 5 }} />
                                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>ELITE<Text style={{ color: '#4DE38F' }}>FIT</Text></Text>
                            </View>
                        </View>
                        <View style={{ paddingHorizontal: 10, gap: 6 }}>
                            <View style={{ width: '100%', height: 20, backgroundColor: theme.surface, borderRadius: 4 }} />
                            <View style={{ width: '100%', height: 40, backgroundColor: theme.surface, borderRadius: 4 }} />
                        </View>
                    </View>

                    {/* Lateral Direita */}
                    <View style={styles.mockupLateral}>
                        {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.mockupLateralLogo} resizeMode="contain" /> : <MaterialCommunityIcons name="image-outline" size={30} color="#333" />}
                    </View>
                </View>
            </View>

            {/* MOCKUP MOBILE (APP DO ALUNO) */}
            <View style={{ width: '100%', backgroundColor: theme.bg, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center', marginBottom: 20 }}>
                <Text style={[styles.cardHeaderSmall, { marginBottom: 15 }]}>COMO O ALUNO VERÁ O RODAPÉ DO APP:</Text>
                <View style={[styles.mockupPhone, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.mockupHeader}>
                        <View style={{ width: 100, height: 16, backgroundColor: theme.border, borderRadius: 4 }} />
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.border }} />
                    </View>
                    <View style={{ padding: 15, gap: 15 }}>
                        <View style={{ width: '60%', height: 14, backgroundColor: theme.border, borderRadius: 4 }} />
                        <View style={{ width: '80%', height: 24, backgroundColor: theme.text, borderRadius: 4, marginBottom: 10 }} />
                        <View style={[styles.mockupBtn, { backgroundColor: theme.accent }]} />
                    </View>
                    <View style={{ alignItems: 'center', paddingBottom: 20, paddingTop: 10, marginTop: 'auto' }}>
                        {logoUrl ? <Image source={{ uri: logoUrl }} style={{ width: logoSize * 0.55, height: (logoSize * 0.55) / 3 }} resizeMode="contain" /> : <><Text style={{ fontWeight: 'bold', fontSize: 12, color: theme.text, letterSpacing: 1 }}>PA TEAM</Text><Text style={{ fontSize: 7, fontWeight: 'bold', color: theme.textSecondary, letterSpacing: 1, marginTop: 2 }}>CONSULTORIA DE PERFORMANCE</Text></>}
                    </View>
                </View>
            </View>

            <TouchableOpacity style={[styles.saveBrandBtn, { backgroundColor: theme.accent }]} onPress={handleSaveBrand} disabled={savingBrand}>
                {savingBrand ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[styles.saveBrandBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>SALVAR MINHA MARCA</Text>}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', width: '100%', marginBottom: 15 }, 
    iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    bigCardDesc: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
    cardHeaderSmall: { color:'#888', fontWeight:'bold', fontSize:12, letterSpacing: 1 },
    logoPreviewBox: { width: '100%', height: 100, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    logoImage: { width: '80%', height: '80%' },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, width: '100%' },
    uploadBtnText: { fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
    sizeAdjustmentBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }, 
    saveBrandBtn: { width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    saveBrandBtnText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
    mockupPhone: { width: 260, height: 450, borderRadius: 30, borderWidth: 4, overflow: 'hidden', justifyContent: 'space-between' },
    mockupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    mockupBtn: { width: '100%', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    
    // 🔥 NOVOS ESTILOS DO MOCKUP DESKTOP 🔥
    mockupDesktop: { width: '100%', height: 200, flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
    mockupLateral: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
    mockupLateralLogo: { width: '80%', height: '50%' },
    mockupCenter: { flex: 2, borderLeftWidth: 1, borderRightWidth: 1 }
});