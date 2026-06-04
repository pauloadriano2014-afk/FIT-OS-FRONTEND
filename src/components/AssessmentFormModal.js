// src/components/AssessmentFormModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, SafeAreaView, Platform, Dimensions, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AssessmentFormModal({
    visible, onClose, editingId, customDate, handleDateChange, method, setMethod,
    weight, setWeight, currentAge, setCurrentAge, currentGender, setCurrentGender,
    folds, setFolds, measures, setMeasures, onSave, theme, isWeb, webOuterBg,
    photos, setPhotos
}) {
    const [pollockTab, setPollockTab] = useState('DOBRAS'); 
    
    const { width: windowWidth } = Dimensions.get('window');
    const isWebPC = isWeb && windowWidth > 768;
    const containerMaxWidth = isWebPC ? 960 : '100%';
    const containerBorders = isWebPC ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border } : {};

    // 🔥 BLINDAGEM: Garante que os valores numéricos cheguem como String, evitando falhas silenciosas no TextInput
    const getStr = (val) => (val !== null && val !== undefined) ? String(val) : '';

    const handleSelectPhoto = async (position) => {
        if (Platform.OS === 'web') {
            window.alert("Por favor, selecione a imagem do seu dispositivo.");
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            if (Platform.OS === 'web') window.alert("Precisamos acessar a galeria para selecionar a foto.");
            else Alert.alert("Permissão", "Precisamos acessar a galeria para selecionar a foto.");
            return;
        }

        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5, 
                base64: true,
                allowsEditing: false, 
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].base64) {
                const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                if (setPhotos) {
                    setPhotos(prev => ({ ...prev, [position]: base64Img }));
                }
            }
        } catch (e) {
            console.log("Erro ao selecionar foto:", e);
        }
    };

    const renderPhotoBox = (label, position, icon) => (
        <TouchableOpacity style={[styles.photoBox, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleSelectPhoto(position)} activeOpacity={0.7}>
            {photos && photos[position] ? (
                <Image source={{ uri: photos[position] }} style={styles.photoPreview} />
            ) : (
                <View style={styles.photoPlaceholder}>
                    <MaterialCommunityIcons name={icon} size={30} color={theme.textSecondary} />
                    <Text style={[styles.photoText, { color: theme.textSecondary }]}>{label}</Text>
                </View>
            )}
            {photos && photos[position] && <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}><MaterialCommunityIcons name="check" size={12} color={theme.isDark ? '#000' : '#FFF'}/></View>}
        </TouchableOpacity>
    );

    // 🔥 PRÉ-VALIDAÇÃO SEGURA: Resolve o "botão morto" forçando o aviso no navegador
    const handleSafeSave = () => {
        console.log("🔥 [MODAL] Botão de Salvar clicado! Processando...");
        
        if (!weight) {
            const msg = "O campo Peso é obrigatório.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Erro", msg);
            return;
        }

        const cleanAge = getStr(currentAge).replace(/[^0-9]/g, '');
        if (method === 'POLLOCK' && !cleanAge) {
            const msg = "A IDADE não pode estar vazia ou inválida. Digite a idade do aluno para calcular o Pollock.";
            if (Platform.OS === 'web') window.alert(msg); else Alert.alert("Atenção", msg);
            return;
        }

        // Se passou na validação segura, aciona o hook do PerformOS
        if (onSave) onSave();
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: isWebPC ? webOuterBg : theme.bg }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalFull}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{ flex: 1, width: '100%', maxWidth: containerMaxWidth, alignSelf: 'center', backgroundColor: theme.bg, ...containerBorders }}>
                            
                            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingId ? "EDITAR AVALIAÇÃO" : "NOVA AVALIAÇÃO"}</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView 
                                style={[styles.scrollArea, isWeb && { overflowY: 'auto' }]} 
                                contentContainerStyle={{padding: 24, paddingBottom: 100}} 
                                showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never"
                            >
                                <Text style={[styles.label, { color: theme.textSecondary }]}>DATA (Opcional - Para Backdate)</Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={getStr(customDate)} onChangeText={handleDateChange} placeholder="DD/MM/AAAA (Deixe vazio para Hoje)" placeholderTextColor={theme.textSecondary} maxLength={10} outlineStyle="none" />
                                
                                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 25 }]}>MÉTODO DA AVALIAÇÃO</Text>
                                <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                                    <TouchableOpacity style={[styles.switchBtn, method === 'BASICO' && { backgroundColor: theme.accent }]} onPress={() => setMethod('BASICO')}>
                                        <Text style={[styles.switchText, { color: method === 'BASICO' ? '#000' : theme.textSecondary, textAlign: 'center' }]}>BÁSICO</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.switchBtn, method === 'POLLOCK' && { backgroundColor: theme.accent }]} onPress={() => setMethod('POLLOCK')}>
                                        <Text style={[styles.switchText, { color: method === 'POLLOCK' ? '#000' : theme.textSecondary, textAlign: 'center' }]}>POLLOCK E{'\n'}PERIMETRIA</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <Text style={[styles.label, { color: theme.textSecondary }]}>PESO (KG) <Text style={{color: '#FF3B30'}}>*Obrigatório</Text></Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(weight)} onChangeText={setWeight} placeholder="Ex: 80.5" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                                
                                {method === 'POLLOCK' ? (
                                    <>
                                    <View style={styles.configRow}>
                                        <View style={{flex:1}}>
                                            <Text style={[styles.label, { color: theme.textSecondary }]}>IDADE</Text>
                                            {/* 🔥 Limpa automaticamente caracteres como '-- anos' se caírem no input */}
                                            <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={getStr(currentAge).replace(/[^0-9]/g, '')} onChangeText={(t) => setCurrentAge(t.replace(/[^0-9]/g, ''))} placeholder="Anos" placeholderTextColor={theme.textSecondary} outlineStyle="none" />
                                        </View>
                                        
                                        <View style={{flex:1, marginLeft: 15}}>
                                            <Text style={[styles.label, { color: theme.accent }]}>GÊNERO (Automático)</Text>
                                            <View style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, justifyContent: 'center' }]}>
                                                <Text style={{color: currentGender ? theme.text : '#FF3B30', fontWeight: 'bold', fontSize: 13}}>
                                                    {currentGender || 'NÃO DEFINIDO'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={[styles.innerTabsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <TouchableOpacity style={[styles.innerTabBtn, pollockTab === 'DOBRAS' && { backgroundColor: theme.accent }]} onPress={() => setPollockTab('DOBRAS')}>
                                            <Text style={[styles.innerTabText, { color: pollockTab === 'DOBRAS' ? '#000' : theme.textSecondary }]}>DOBRAS (mm)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.innerTabBtn, pollockTab === 'PERIMETRIA' && { backgroundColor: theme.accent }]} onPress={() => setPollockTab('PERIMETRIA')}>
                                            <Text style={[styles.innerTabText, { color: pollockTab === 'PERIMETRIA' ? '#000' : theme.textSecondary }]}>PERIMETRIA (cm)</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {pollockTab === 'DOBRAS' ? (
                                        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={styles.grid}>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PEITORAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldChest)} onChangeText={t=>setFolds({...folds, foldChest:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>AXILAR</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldAxillary)} onChangeText={t=>setFolds({...folds, foldAxillary:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TRÍCEPS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldTriceps)} onChangeText={t=>setFolds({...folds, foldTriceps:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUBESCAP.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldSubscapular)} onChangeText={t=>setFolds({...folds, foldSubscapular:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDOMINAL</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldAbdominal)} onChangeText={t=>setFolds({...folds, foldAbdominal:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>SUPRA-IL.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldSuprailiac)} onChangeText={t=>setFolds({...folds, foldSuprailiac:t})} outlineStyle="none"/></View>
                                                <View style={styles.gridItem}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>COXA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(folds?.foldThigh)} onChangeText={t=>setFolds({...folds, foldThigh:t})} outlineStyle="none"/></View>
                                            </View>
                                            <Text style={[styles.hint, { color: theme.textSecondary }]}>O app usará a soma das dobras e a idade para calcular o % de Gordura.</Text>
                                        </View>
                                    ) : (
                                        <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <Text style={[styles.hint, { color: theme.textSecondary, marginBottom: 20, marginTop: 0 }]}>Preencha apenas os campos desejados. Campos vazios não aparecerão no laudo.</Text>
                                            
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>TÓRAX</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.chestMeasure)} onChangeText={t=>setMeasures({...measures, chestMeasure:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>OMBROS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.shoulders)} onChangeText={t=>setMeasures({...measures, shoulders:t})} outlineStyle="none"/></View>
                                            </View>
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>CINTURA</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.waist)} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ABDÔMEN</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.abdomen)} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>GLÚTEOS</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.hips)} onChangeText={t=>setMeasures({...measures, hips:t})} outlineStyle="none"/></View>
                                            </View>
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>BRAÇO DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.armRight)} onChangeText={t=>setMeasures({...measures, armRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>BRAÇO ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.armLeft)} onChangeText={t=>setMeasures({...measures, armLeft:t})} outlineStyle="none"/></View>
                                            </View>
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ANTEB. DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.forearmRight)} onChangeText={t=>setMeasures({...measures, forearmRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>ANTEB. ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.forearmLeft)} onChangeText={t=>setMeasures({...measures, forearmLeft:t})} outlineStyle="none"/></View>
                                            </View>
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 15}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PERNA DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.legRight)} onChangeText={t=>setMeasures({...measures, legRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PERNA ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.legLeft)} onChangeText={t=>setMeasures({...measures, legLeft:t})} outlineStyle="none"/></View>
                                            </View>
                                            <View style={{flexDirection: 'row', gap: 15, marginBottom: 5}}>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PANTU. DIR.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.calfRight)} onChangeText={t=>setMeasures({...measures, calfRight:t})} outlineStyle="none"/></View>
                                                <View style={{flex: 1}}><Text style={[styles.miniLabel, { color: theme.textSecondary }]}>PANTU. ESQ.</Text><TextInput style={[styles.miniInput, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.calfLeft)} onChangeText={t=>setMeasures({...measures, calfLeft:t})} outlineStyle="none"/></View>
                                            </View>
                                        </View>
                                    )}
                                    </>
                                ) : (
                                    <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 0 }]}>CINTURA (CM) - Opcional</Text>
                                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 15 }]} keyboardType="decimal-pad" value={getStr(measures?.waist)} onChangeText={t=>setMeasures({...measures, waist:t})} outlineStyle="none" />
                                        
                                        <Text style={[styles.label, { color: theme.textSecondary }]}>ABDÔMEN (CM) - Opcional</Text>
                                        <TextInput style={[styles.input, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border }]} keyboardType="decimal-pad" value={getStr(measures?.abdomen)} onChangeText={t=>setMeasures({...measures, abdomen:t})} outlineStyle="none" />
                                    </View>
                                )}

                                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 25 }]}>FOTOS DA AVALIAÇÃO (Opcional)</Text>
                                <View style={styles.photosRow}>
                                    {renderPhotoBox("FRENTE", "front", "account")}
                                    {renderPhotoBox("LADO", "side", "account-box-outline")}
                                    {renderPhotoBox("COSTAS", "back", "account-convert")}
                                </View>
                                
                                {/* 🔥 Substituí o disparo direto pelo nosso validador blindado 🔥 */}
                                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSafeSave}>
                                    <MaterialCommunityIcons name="content-save-outline" size={24} color="#000" />
                                    <Text style={[styles.saveBtnText, { color: '#000' }]}>{editingId ? "ATUALIZAR AVALIAÇÃO" : "SALVAR AVALIAÇÃO"}</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalFull: { flex: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, marginTop: Platform.OS === 'android' ? 20 : 0 },
    modalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
    closeBtn: { padding: 4 },
    scrollArea: { flex: 1, width: '100%' },
    
    label: { fontSize: 11, fontWeight: '800', marginBottom: 8, marginTop: 20, letterSpacing: 1 },
    input: { padding: 16, borderRadius: 16, borderWidth: 1, fontSize: 16, fontWeight: '600' }, 
    
    switchRow: { flexDirection: 'row', borderRadius: 16, padding: 4, marginBottom: 10 },
    switchBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    switchText: { fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },
    
    configRow: { flexDirection:'row', marginBottom: 5, marginTop: 10 },
    
    innerTabsContainer: { flexDirection: 'row', marginTop: 30, marginBottom: 15, borderRadius: 16, padding: 4, borderWidth: 1 },
    innerTabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    innerTabText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    
    cardContainer: { padding: 20, borderRadius: 20, borderWidth: 1 },
    
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: '31%', marginBottom: 10 },
    miniLabel: { fontSize: 10, fontWeight: '800', marginBottom: 6, letterSpacing: 0.5 },
    miniInput: { padding: 14, borderRadius: 12, borderWidth: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }, 
    
    hint: { fontSize: 12, fontStyle: 'italic', marginTop: 20, textAlign: 'center', lineHeight: 18 },

    photosRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    photoBox: { width: '31%', aspectRatio: 0.8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    photoPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    photoText: { fontSize: 10, fontWeight: 'bold', marginTop: 5 },
    photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    checkBadge: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex:10 },
    
    saveBtn: { flexDirection: 'row', padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 35, elevation: 4 },
    saveBtnText: { fontWeight: '900', fontSize: 15, letterSpacing: 1 }
});