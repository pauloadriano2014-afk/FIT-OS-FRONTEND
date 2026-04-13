// src/screens/AdminIALabScreen.js
import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
    ActivityIndicator, Alert, Platform, StatusBar, Image, TextInput, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { useTheme } from '../contexts/ThemeContext';

export default function AdminIALabScreen({ navigation }) {
    const { theme } = useTheme();

    const [analysisType, setAnalysisType] = useState('initial'); 
    const [contextText, setContextText] = useState('');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultText, setResultText] = useState('');

    const [alunos, setAlunos] = useState([]);
    const [selectedAluno, setSelectedAluno] = useState(null); 
    const [isSendingToAluno, setIsSendingToAluno] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentFront, setCurrentFront] = useState(null);
    const [currentSide, setCurrentSide] = useState(null);
    const [currentBack, setCurrentBack] = useState(null);

    const [oldFront, setOldFront] = useState(null);
    const [oldSide, setOldSide] = useState(null);
    const [oldBack, setOldBack] = useState(null);

    useEffect(() => {
        fetchAlunos();
    }, []);

    const fetchAlunos = async () => {
        try {
            const userString = await AsyncStorage.getItem('user');
            if (!userString) return;
            const userObj = JSON.parse(userString);
            const adminId = userObj.id;

            const t = Date.now();
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/data?adminId=${adminId}&t=${t}`);
            
            if (res.ok) {
                const data = await res.json();
                const rawAtivos = data.activeUsers || data.users || [];
                const rawInativos = data.inactiveUsers || [];
                const todos = [...rawAtivos, ...rawInativos].sort((a,b) => a.name?.localeCompare(b.name));
                setAlunos(todos);
            }
        } catch (e) { 
            console.log("Erro ao buscar alunos no Lab:", e); 
        }
    };

    const optimizeImage = async (uri) => {
        try {
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1080 } }], 
                { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            return { uri: result.uri, base64: result.base64 };
        } catch (error) {
            console.error("Erro ao otimizar imagem:", error);
            return null;
        }
    };

    const pickImage = async (type, slot) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para upar as fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1, 
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const optimized = await optimizeImage(asset.uri);
            if (optimized) {
                if (type === 'current') {
                    if (slot === 'front') setCurrentFront(optimized);
                    if (slot === 'side') setCurrentSide(optimized);
                    if (slot === 'back') setCurrentBack(optimized);
                } else if (type === 'old') {
                    if (slot === 'front') setOldFront(optimized);
                    if (slot === 'side') setOldSide(optimized);
                    if (slot === 'back') setOldBack(optimized);
                }
            }
        }
    };

    const removeImage = (type, slot) => {
        if (type === 'current') {
            if (slot === 'front') setCurrentFront(null);
            if (slot === 'side') setCurrentSide(null);
            if (slot === 'back') setCurrentBack(null);
        } else if (type === 'old') {
            if (slot === 'front') setOldFront(null);
            if (slot === 'side') setOldSide(null);
            if (slot === 'back') setOldBack(null);
        }
    };

    const handleGenerate = async () => {
        if (!currentFront && !currentSide && !currentBack) {
            Alert.alert("Atenção", "Adicione pelo menos uma foto ATUAL para a IA analisar.");
            return;
        }
        if (analysisType === 'comparison' && (!oldFront && !oldSide && !oldBack)) {
            Alert.alert("Atenção", "Adicione pelo menos uma foto do ANTES para a IA comparar.");
            return;
        }

        setIsGenerating(true);
        setResultText('');

        try {
            const customCurrentPhotos = [
                currentFront ? `data:image/jpeg;base64,${currentFront.base64}` : '',
                currentSide ? `data:image/jpeg;base64,${currentSide.base64}` : '',
                currentBack ? `data:image/jpeg;base64,${currentBack.base64}` : ''
            ];

            const customOldPhotos = analysisType === 'comparison' ? [
                oldFront ? `data:image/jpeg;base64,${oldFront.base64}` : '',
                oldSide ? `data:image/jpeg;base64,${oldSide.base64}` : '',
                oldBack ? `data:image/jpeg;base64,${oldBack.base64}` : ''
            ] : [];

            // 🔥 A MÁGICA SALVADORA 2.0: Removi o maldito headers['userId'] daqui! 🔥
            // Agora o labUserId viaja SÓ dentro do body (onde o CORS não apita).
            const res = await fetch('https://fitos-final.onrender.com/api/ai/evaluate-checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }, // Limpo e seguro
                body: JSON.stringify({
                    isFromLab: true, 
                    labUserId: selectedAluno ? selectedAluno.id : null,
                    customCurrentPhotos: customCurrentPhotos,
                    customOldPhotos: customOldPhotos,
                    contextText: contextText
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
            const msgErro = "Falha ao gerar o laudo. Verifique sua conexão e o console.";
            if (Platform.OS === 'web') window.alert(msgErro);
            else Alert.alert("Erro no Motor IA", msgErro);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendToAluno = async () => {
        if (!selectedAluno) {
            const msg = "Selecione um aluno na lista acima para enviar o laudo.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Atenção", msg);
            return;
        }
        if (!resultText.trim()) {
            const msg = "O texto do laudo está vazio. Gere ou digite o laudo primeiro.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Atenção", msg);
            return;
        }

        const confirmSend = async () => {
            setIsSendingToAluno(true);
            try {
                // Aqui o backend salva só o 'Depois' no banco pra evolução (Lab Evaluation)
                const payloadImages = [
                    currentFront?.base64 || '',
                    currentSide?.base64 || '',
                    currentBack?.base64 || ''
                ];

                const res = await fetch('https://fitos-final.onrender.com/api/checkin/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: selectedAluno.id,
                        coachFeedback: resultText,
                        images: payloadImages,
                        isLabSave: true
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    const okMsg = `Laudo enviado para ${selectedAluno.name} e salvo na evolução com sucesso!`;
                    if (Platform.OS === 'web') window.alert(okMsg); else Alert.alert("Sucesso!", okMsg);
                    
                    setCurrentFront(null); setCurrentSide(null); setCurrentBack(null);
                    setOldFront(null); setOldSide(null); setOldBack(null);
                    setResultText('');
                    setContextText('');
                    setSelectedAluno(null);
                } else {
                    throw new Error(data.error || "Erro desconhecido na API.");
                }
            } catch (error) {
                console.error("Erro ao enviar laudo:", error);
                const erroMsg = "Falha ao upar fotos e salvar o laudo.";
                if (Platform.OS === 'web') window.alert(erroMsg); else Alert.alert("Erro", erroMsg);
            } finally {
                setIsSendingToAluno(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Isso fará o upload das fotos e enviará o laudo para ${selectedAluno.name}. Continuar?`)) confirmSend();
        } else {
            Alert.alert("Confirmação", `Isso fará o upload das fotos e enviará o laudo para ${selectedAluno.name}. Continuar?`, [
                { text: "Cancelar", style: "cancel" },
                { text: "Enviar", onPress: confirmSend }
            ]);
        }
    };

    const handleCopy = async () => {
        if (!resultText) return;
        await Clipboard.setStringAsync(resultText);
        if (Platform.OS === 'web') window.alert("Laudo copiado!");
        else Alert.alert("Copiado!", "Laudo copiado para a área de transferência.");
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

    const filteredAlunos = alunos.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>LABORATÓRIO V3</Text>
                        <Text style={{ color: '#4DE38F', fontSize: 12, fontWeight: 'bold' }} numberOfLines={1}>INTELIGÊNCIA ARTIFICIAL</Text>
                    </View>
                    <View style={{ width: 42 }} /> 
                </View>

                <View style={{ flex: 1, position: 'relative' }}>
                    <ScrollView 
                        style={isWeb ? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto' } : { flex: 1 }} 
                        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
                        showsVerticalScrollIndicator={false}
                    >
                        
                        <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 10 }]}>ALUNO ALVO DA ANÁLISE</Text>
                        <TouchableOpacity 
                            style={[styles.dropdownHeader, { backgroundColor: theme.surface, borderColor: selectedAluno ? '#34C759' : theme.border }]} 
                            onPress={() => {
                                setDropdownVisible(!dropdownVisible);
                                setSearchQuery(''); 
                            }}
                        >
                            <MaterialCommunityIcons name="account-search" size={20} color={selectedAluno ? '#34C759' : theme.textSecondary} />
                            <Text style={{ flex: 1, marginLeft: 10, color: selectedAluno ? '#34C759' : theme.text, fontWeight: 'bold', fontSize: 13 }}>
                                {selectedAluno ? selectedAluno.name : 'Nenhum (Apenas Teste Avulso)'}
                            </Text>
                            <MaterialCommunityIcons name={dropdownVisible ? "chevron-up" : "chevron-down"} size={22} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {dropdownVisible && (
                            <View style={[styles.dropdownContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <View style={[styles.searchBox, { borderBottomColor: theme.border }]}>
                                    <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                                    <TextInput
                                        style={[styles.searchInput, { color: theme.text }]}
                                        placeholder="Buscar pelo nome..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoFocus={Platform.OS !== 'web'}
                                    />
                                </View>

                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
                                    <TouchableOpacity 
                                        style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                                        onPress={() => { setSelectedAluno(null); setDropdownVisible(false); setSearchQuery(''); }}
                                    >
                                        <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Nenhum (Apenas Teste Avulso)</Text>
                                    </TouchableOpacity>
                                    
                                    {filteredAlunos.length > 0 ? (
                                        filteredAlunos.map(a => (
                                            <TouchableOpacity 
                                                key={a.id} 
                                                style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                                                onPress={() => { setSelectedAluno(a); setDropdownVisible(false); setSearchQuery(''); }}
                                            >
                                                <Text style={{ color: theme.text, fontWeight: 'bold' }}>{a.name}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={{ padding: 15, alignItems: 'center' }}>
                                            <Text style={{ color: theme.textSecondary, fontStyle: 'italic' }}>Nenhum aluno encontrado.</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}


                        <View style={{flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 20, marginTop: 15, borderWidth: 1, borderColor: theme.border}}>
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

                        {analysisType === 'comparison' && (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>FOTOS BASE (ANTES)</Text>
                                <View style={styles.specificSlotsContainer}>
                                    <TouchableOpacity style={styles.slotBox} onPress={() => pickImage('old', 'front')}>
                                        {oldFront ? (
                                            <><Image source={{ uri: oldFront.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('old', 'front')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                        ) : (
                                            <View style={styles.slotEmpty}><MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>FRENTE</Text></View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.slotBox} onPress={() => pickImage('old', 'side')}>
                                        {oldSide ? (
                                            <><Image source={{ uri: oldSide.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('old', 'side')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                        ) : (
                                            <View style={styles.slotEmpty}><MaterialCommunityIcons name="human-male-height" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>LADO</Text></View>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.slotBox} onPress={() => pickImage('old', 'back')}>
                                        {oldBack ? (
                                            <><Image source={{ uri: oldBack.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('old', 'back')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                        ) : (
                                            <View style={styles.slotEmpty}><MaterialCommunityIcons name="account-arrow-left" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>COSTAS</Text></View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={{ marginBottom: 20 }}>
                            <Text style={[styles.sectionLabel, { color: theme.text }]}>
                                {analysisType === 'comparison' ? 'FOTOS ATUAIS (DEPOIS)' : 'FOTOS DO SHAPE'}
                            </Text>
                            <View style={styles.specificSlotsContainer}>
                                <TouchableOpacity style={[styles.slotBox, { borderColor: theme.border }]} onPress={() => pickImage('current', 'front')}>
                                    {currentFront ? (
                                        <><Image source={{ uri: currentFront.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('current', 'front')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                    ) : (
                                        <View style={styles.slotEmpty}><MaterialCommunityIcons name="account" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>FRENTE</Text></View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.slotBox, { borderColor: theme.border }]} onPress={() => pickImage('current', 'side')}>
                                    {currentSide ? (
                                        <><Image source={{ uri: currentSide.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('current', 'side')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                    ) : (
                                        <View style={styles.slotEmpty}><MaterialCommunityIcons name="human-male-height" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>LADO</Text></View>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.slotBox, { borderColor: theme.border }]} onPress={() => pickImage('current', 'back')}>
                                    {currentBack ? (
                                        <><Image source={{ uri: currentBack.uri }} style={styles.slotImg} /><TouchableOpacity style={styles.slotRemove} onPress={() => removeImage('current', 'back')}><MaterialCommunityIcons name="close-circle" size={20} color="#FF3B30" /></TouchableOpacity></>
                                    ) : (
                                        <View style={styles.slotEmpty}><MaterialCommunityIcons name="account-arrow-left" size={24} color={theme.textSecondary} /><Text style={[styles.slotText, { color: theme.textSecondary }]}>COSTAS</Text></View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[styles.sectionLabel, { color: theme.text }]}>DIRECIONAMENTO (OPCIONAL)</Text>
                        <TextInput 
                            style={[styles.inputContext, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                            placeholder="Ex: Aluno sente dor no ombro; avaliar assimetria nas costas..."
                            placeholderTextColor={theme.textSecondary}
                            multiline
                            value={contextText}
                            onChangeText={setContextText}
                        />

                        <TouchableOpacity 
                            style={[styles.generateBtn, { backgroundColor: '#4DE38F15', borderColor: '#4DE38F' }]}
                            onPress={handleGenerate}
                            disabled={isGenerating || isSendingToAluno}
                        >
                            {isGenerating ? <ActivityIndicator color="#4DE38F" /> : (
                                <>
                                    <MaterialCommunityIcons name="brain" size={24} color="#4DE38F" />
                                    <Text style={styles.generateBtnText}>GERAR LAUDO COM IA</Text>
                                </>
                            )}
                        </TouchableOpacity>

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

                                {selectedAluno && (
                                    <TouchableOpacity 
                                        style={[styles.saveAlunoBtn, { backgroundColor: '#34C759' }]}
                                        onPress={handleSendToAluno}
                                        disabled={isSendingToAluno}
                                    >
                                        {isSendingToAluno ? <ActivityIndicator color="#000" /> : (
                                            <>
                                                <MaterialCommunityIcons name="cloud-upload" size={22} color="#000" />
                                                <Text style={styles.saveAlunoBtnText}>ENVIAR LAUDO E SALVAR NO APP</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : null}

                    </ScrollView>
                </View>
            </View>
        </RootComponent>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 },
    header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1, flexShrink: 0 },
    backBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
    headerTitle: { fontWeight:'900', fontSize:16, letterSpacing: 1 },
    
    dropdownHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
    dropdownContainer: { borderWidth: 1, borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
    searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, padding: 0, outlineStyle: 'none' },
    dropdownItem: { padding: 15, borderBottomWidth: 1 },

    tabBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
    tabBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },
    
    sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    
    specificSlotsContainer: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
    slotBox: { flex: 1, height: 130, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    slotEmpty: { alignItems: 'center', justifyContent: 'center' },
    slotText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
    slotImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    slotRemove: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFF', borderRadius: 10 },

    inputContext: { padding: 15, borderRadius: 12, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none', marginBottom: 25, fontSize: 14 },
    
    generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, borderWidth: 1, gap: 10, marginBottom: 30 },
    generateBtnText: { color: '#4DE38F', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    
    resultContainer: { padding: 20, borderRadius: 16, borderWidth: 1, marginTop: 10 },
    resultInput: { minHeight: 200, fontSize: 15, lineHeight: 24, outlineStyle: 'none', marginBottom: 20 },
    
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, gap: 8, borderColor: 'transparent' },
    actionBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

    saveAlunoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 15, gap: 10 },
    saveAlunoBtnText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5, color: '#000' }
});