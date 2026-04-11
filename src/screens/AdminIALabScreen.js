// src/screens/AdminIALabScreen.js
import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
    ActivityIndicator, Alert, Platform, StatusBar, Image, TextInput, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminIALabScreen({ navigation }) {
    const { theme } = useTheme();

    const [analysisType, setAnalysisType] = useState('initial'); // 'initial' ou 'comparison'
    const [images, setImages] = useState([]); // Array de { uri, base64 }
    const [contextText, setContextText] = useState('');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultText, setResultText] = useState('');

    const pickImage = async () => {
        // Solicita permissão de galeria
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para upar as fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true, // Crucial para enviar para a API
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            setImages(prev => [...prev, { uri: asset.uri, base64: asset.base64 }]);
        }
    };

    const removeImage = (indexToRemove) => {
        setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerate = async () => {
        if (images.length === 0) {
            Alert.alert("Atenção", "Adicione pelo menos uma foto para a IA analisar.");
            return;
        }

        setIsGenerating(true);
        setResultText('');

        try {
            // Formata as imagens para a API
            const payloadImages = images.map(img => ({
                data: img.base64,
                mimeType: "image/jpeg"
            }));

            const res = await fetch('https://fitos-final.onrender.com/api/ai/evaluate-lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    images: payloadImages,
                    contextText: contextText,
                    analysisType: analysisType
                })
            });

            const data = await res.json();

            if (data.analysis) {
                setResultText(data.analysis);
            } else {
                throw new Error(data.error || "A IA não retornou um laudo válido.");
            }

        } catch (error) {
            console.error("Erro Lab IA:", error);
            Alert.alert("Erro no Motor IA", "Falha ao gerar o laudo. Verifique sua conexão e o console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = async () => {
        if (!resultText) return;
        await Clipboard.setStringAsync(resultText);
        Alert.alert("Copiado!", "Laudo copiado para a área de transferência.");
    };

    const handleWhatsApp = () => {
        if (!resultText) return;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(resultText)}`;
        Linking.canOpenURL(whatsappUrl).then(supported => {
            if (supported) Linking.openURL(whatsappUrl);
            else {
                if (Platform.OS === 'web') window.open(whatsappUrl, '_blank');
                else Alert.alert("Aviso", "Não foi possível abrir o WhatsApp.");
            }
        });
    };

    const isWeb = Platform.OS === 'web';
    const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
    const RootComponent = isWeb ? View : SafeAreaView;

    return (
        <RootComponent style={[
            styles.container, 
            { 
                backgroundColor: isWeb ? webOuterBg : theme.bg,
                ...(isWeb ? { height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}) 
            }
        ]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
            
            <View style={{ 
                flex: 1, minHeight: 0, width: '100%', maxWidth: isWeb ? 550 : '100%', 
                alignSelf: 'center', backgroundColor: theme.bg, overflow: 'hidden',
                ...(isWeb ? { display: 'flex', flexDirection: 'column', borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {}) 
            }}>
                
                {/* HEADER */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>LABORATÓRIO</Text>
                        <Text style={{ color: '#4DE38F', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>INTELIGÊNCIA ARTIFICIAL</Text>
                    </View>
                    <View style={{ width: 42 }} /> 
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
                    
                    {/* SELETOR DE TIPO DE ANÁLISE */}
                    <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: theme.border}}>
                        <TouchableOpacity 
                            style={[styles.tabBtn, { backgroundColor: analysisType === 'initial' ? '#4DE38F' : 'transparent' }]}
                            onPress={() => setAnalysisType('initial')}
                        >
                            <Text style={[styles.tabBtnText, { color: analysisType === 'initial' ? '#000' : theme.textSecondary }]}>ANÁLISE ÚNICA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.tabBtn, { backgroundColor: analysisType === 'comparison' ? '#4DE38F' : 'transparent' }]}
                            onPress={() => setAnalysisType('comparison')}
                        >
                            <Text style={[styles.tabBtnText, { color: analysisType === 'comparison' ? '#000' : theme.textSecondary }]}>COMPARATIVO</Text>
                        </TouchableOpacity>
                    </View>

                    {/* UPLOAD DE FOTOS */}
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>FOTOS DO SHAPE</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 15 }}>
                        {analysisType === 'initial' ? "Adicione fotos de Frente, Lado e Costas." : "Adicione as fotos do ANTES e do DEPOIS juntas."}
                    </Text>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingBottom: 10, marginBottom: 20 }}>
                        {images.map((img, index) => (
                            <View key={index} style={styles.photoWrapper}>
                                <Image source={{ uri: img.uri }} style={[styles.photoImg, { borderColor: theme.border }]} />
                                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removeImage(index)}>
                                    <MaterialCommunityIcons name="close-circle" size={24} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        
                        <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={pickImage}>
                            <MaterialCommunityIcons name="camera-plus" size={32} color="#4DE38F" />
                            <Text style={{ color: '#4DE38F', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>ADICIONAR</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* CONTEXTO */}
                    <Text style={[styles.sectionLabel, { color: theme.text }]}>DIRECIONAMENTO (OPCIONAL)</Text>
                    <TextInput 
                        style={[styles.inputContext, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                        placeholder="Ex: Aluno sente dor no ombro; avaliar assimetria nas costas..."
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        value={contextText}
                        onChangeText={setContextText}
                    />

                    {/* BOTÃO GERAR */}
                    <TouchableOpacity 
                        style={[styles.generateBtn, { backgroundColor: '#4DE38F15', borderColor: '#4DE38F' }]}
                        onPress={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? <ActivityIndicator color="#4DE38F" /> : (
                            <>
                                <MaterialCommunityIcons name="brain" size={24} color="#4DE38F" />
                                <Text style={styles.generateBtnText}>GERAR LAUDO COM IA</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* RESULTADO */}
                    {resultText ? (
                        <View style={[styles.resultContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Text style={[styles.sectionLabel, { color: '#4DE38F', marginBottom: 15 }]}>LAUDO TÉCNICO GERADO:</Text>
                            <TextInput 
                                style={[styles.resultInput, { color: theme.text }]}
                                multiline
                                editable={true}
                                value={resultText}
                                onChangeText={setResultText}
                            />
                            
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bg, borderColor: theme.border }]} onPress={handleCopy}>
                                    <MaterialCommunityIcons name="content-copy" size={20} color={theme.text} />
                                    <Text style={[styles.actionBtnText, { color: theme.text }]}>COPIAR</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
                                    <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
                                    <Text style={[styles.actionBtnText, { color: '#FFF' }]}>WHATSAPP</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}

                </ScrollView>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1, flexShrink: 0 },
    backBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
    headerTitle: { fontWeight:'900', fontSize:16, letterSpacing: 1 },
    
    tabBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    tabBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    
    sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    
    photoWrapper: { position: 'relative', width: 100, height: 140 },
    photoImg: { width: '100%', height: '100%', borderRadius: 12, borderWidth: 1, resizeMode: 'cover' },
    removePhotoBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12 },
    
    addPhotoBtn: { width: 100, height: 140, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    
    inputContext: { padding: 15, borderRadius: 12, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none', marginBottom: 25, fontSize: 14 },
    
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, gap: 10, marginBottom: 30 },
    generateBtnText: { color: '#4DE38F', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    
    resultContainer: { padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 10 },
    resultInput: { minHeight: 200, fontSize: 15, lineHeight: 24, outlineStyle: 'none', marginBottom: 20 },
    
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, borderColor: 'transparent' },
    actionBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 }
});