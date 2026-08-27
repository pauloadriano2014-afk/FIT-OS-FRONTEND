import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Image, ActivityIndicator, Alert, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { authHeaders } from '../../utils/authToken';

const PREDEFINED_COLORS = [
    { label: 'Verde Neon', hex: '#4DE38F' }, { label: 'Azul Pro', hex: '#32ADE6' },
    { label: 'Vermelho Elite', hex: '#FF3B30' }, { label: 'Dourado VIP', hex: '#FFCC00' },
    { label: 'Roxo Tech', hex: '#BF5AF2' },
];

const AVAILABLE_FEATURES = [
    { id: 'treinos', label: 'Treinos Personalizados', icon: 'dumbbell' }, { id: 'videos', label: 'Vídeos de Execução', icon: 'play-circle' },
    { id: 'cronometro', label: 'Cronômetro Integrado', icon: 'timer-outline' }, { id: 'dieta', label: 'Sugestão Alimentar', icon: 'food-apple' },
    { id: 'checkin', label: 'Avaliações e Check-ins', icon: 'camera-timer' }, { id: 'graficos', label: 'Gráficos de Progresso', icon: 'chart-line' },
    { id: 'gamificacao', label: 'Gamificação e Ranking', icon: 'trophy' }, { id: 'historico', label: 'Histórico de Treinos', icon: 'calendar-check' },
    { id: 'flix', label: 'Área de Membros (Flix)', icon: 'play-box-multiple' }, { id: 'substituicao', label: 'Substituição de Exercícios', icon: 'swap-horizontal' },
    { id: 'suporte', label: 'Suporte VIP no WhatsApp', icon: 'whatsapp' },
];

export default function TabSaaS({ theme, currentUserId }) {
    const [pageTitle, setPageTitle] = useState('');
    const [aboutText, setAboutText] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [coachPhotoUrl, setCoachPhotoUrl] = useState('');
    const [themeColor, setThemeColor] = useState('#4DE38F');
    const [appFeatures, setAppFeatures] = useState(['treinos', 'checkin', 'suporte']);
    const [pixKey, setPixKey] = useState('');
    const [pixName, setPixName] = useState('');

    const [galleryPairs, setGalleryPairs] = useState([
        { id: 0, before: '', after: '', text: '' }, { id: 1, before: '', after: '', text: '' },
        { id: 2, before: '', after: '', text: '' }, { id: 3, before: '', after: '', text: '' }
    ]);
    const [testimonials, setTestimonials] = useState([
        { id: 0, name: '', text: '' }, { id: 1, name: '', text: '' },
        { id: 2, name: '', text: '' }, { id: 3, name: '', text: '' }
    ]);

    const [uploadingSlot, setUploadingSlot] = useState(null);
    const [plans, setCoachPlans] = useState([]);
    const [loadingSaaS, setLoadingSaaS] = useState(false);

    const [planIdEditing, setPlanIdEditing] = useState(null);
    const [planName, setPlanName] = useState('');
    const [planValue, setPlanValue] = useState('');
    const [planMonths, setPlanMonths] = useState('');
    const [planDiscount, setPlanDiscount] = useState('0');
    const [planPaymentUrl, setPlanPaymentUrl] = useState(''); 

    useEffect(() => {
        if (currentUserId) fetchSaaSMeta(currentUserId);
    }, [currentUserId]);

    const fetchSaaSMeta = async (coachId) => {
        setLoadingSaaS(true);
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/saas-meta?coachId=${coachId}`, {
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) {
                const data = await res.json();
                setPageTitle(data.config?.pageTitle || '');
                setAboutText(data.config?.aboutText || '');
                setVideoUrl(data.config?.videoUrl || '');
                setCoachPhotoUrl(data.config?.coachPhotoUrl || '');
                setThemeColor(data.config?.themeColor || '#4DE38F');
                setAppFeatures(data.config?.appFeatures || ['treinos', 'checkin', 'suporte']);
                setPixKey(data.config?.pixKey || '');
                setPixName(data.config?.pixName || '');
                
                const loadedPhotos = data.config?.galleryPhotos || [];
                const loadedTexts = data.config?.galleryTexts || [];
                setGalleryPairs([
                    { id: 0, before: loadedPhotos[0] || '', after: loadedPhotos[1] || '', text: loadedTexts[0] || '' },
                    { id: 1, before: loadedPhotos[2] || '', after: loadedPhotos[3] || '', text: loadedTexts[1] || '' },
                    { id: 2, before: loadedPhotos[4] || '', after: loadedPhotos[5] || '', text: loadedTexts[2] || '' },
                    { id: 3, before: loadedPhotos[6] || '', after: loadedPhotos[7] || '', text: loadedTexts[3] || '' },
                ]);

                const testNames = data.config?.testimonialNames || [];
                const testTexts = data.config?.testimonialTexts || [];
                setTestimonials([
                    { id: 0, name: testNames[0] || '', text: testTexts[0] || '' }, { id: 1, name: testNames[1] || '', text: testTexts[1] || '' },
                    { id: 2, name: testNames[2] || '', text: testTexts[2] || '' }, { id: 3, name: testNames[3] || '', text: testTexts[3] || '' },
                ]);

                setCoachPlans(data.plans || []);
            }
        } catch (e) { console.log("Erro SaaS", e); }
        finally { setLoadingSaaS(false); }
    };

    const handleSaveSalesPage = async () => {
        try {
            const galleryPhotos = []; const galleryTexts = [];
            galleryPairs.forEach(p => { galleryPhotos.push(p.before); galleryPhotos.push(p.after); galleryTexts.push(p.text); });
            const testimonialNames = testimonials.map(t => t.name); const testimonialTexts = testimonials.map(t => t.text);

            const res = await fetch('https://fitos-final.onrender.com/api/admin/saas-meta/page', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({ coachId: currentUserId, pageTitle, aboutText, videoUrl, coachPhotoUrl, themeColor, appFeatures, galleryPhotos, galleryTexts, testimonialNames, testimonialTexts, pixKey, pixName })
            });
            if (res.ok) {
                if (Platform.OS === 'web') window.alert("Página salva com sucesso!");
                else Alert.alert("Sucesso", "Configurações salvas!");
            }
        } catch (e) { Alert.alert("Erro", "Falha ao salvar página de vendas."); }
    };

    const toggleFeature = (featureId) => setAppFeatures(prev => prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]);

    const uploadImageToR2 = async (uri, isSquare = true) => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') throw new Error('Sem permissão');
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

    const handlePickCoachPhoto = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
            if (!result.canceled) { setUploadingSlot('coachPhoto'); const url = await uploadImageToR2(result.assets[0].uri); setCoachPhotoUrl(url); }
        } catch (error) { Alert.alert("Erro", "Falha ao enviar a foto."); } finally { setUploadingSlot(null); }
    };

    const handlePickGalleryPhoto = async (index, type) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
            if (!result.canceled) { setUploadingSlot(`${index}-${type}`); const url = await uploadImageToR2(result.assets[0].uri); setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, [type]: url } : pair)); }
        } catch (error) { Alert.alert("Erro", "Falha ao enviar foto."); } finally { setUploadingSlot(null); }
    };

    const removeGalleryPhoto = (index, type) => setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, [type]: '' } : pair));
    const handleGalleryTextChange = (index, text) => setGalleryPairs(prev => prev.map((pair, i) => i === index ? { ...pair, text } : pair));
    const handleTestimonialChange = (index, field, value) => setTestimonials(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));

    const handleAddOrUpdatePlan = async () => {
        if (!planName || !planValue || !planMonths) return Alert.alert("Aviso", "Preencha o Nome, Valor Base e Meses.");
        try {
            const res = await fetch('https://fitos-final.onrender.com/api/admin/saas-meta/plan', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    coachId: currentUserId, planId: planIdEditing, name: planName, 
                    value: parseFloat(planValue.replace(',', '.')), durationInMonths: parseInt(planMonths),
                    discountPerc: parseInt(planDiscount) || 0, paymentUrl: planPaymentUrl
                })
            });
            if (res.ok) {
                setPlanName(''); setPlanValue(''); setPlanMonths(''); setPlanDiscount('0'); setPlanPaymentUrl(''); setPlanIdEditing(null);
                fetchSaaSMeta(currentUserId);
            }
        } catch (e) { Alert.alert("Erro", "Não foi possível salvar o plano."); }
    };

    const startEditingPlan = (plan) => {
        setPlanIdEditing(plan.id); setPlanName(plan.name); setPlanValue(plan.value.toString());
        setPlanMonths(plan.durationInMonths.toString()); setPlanDiscount((plan.discountPerc || 0).toString()); setPlanPaymentUrl(plan.paymentUrl || '');
    };
    const cancelEditingPlan = () => { setPlanIdEditing(null); setPlanName(''); setPlanValue(''); setPlanMonths(''); setPlanDiscount('0'); setPlanPaymentUrl(''); };

    const handleDeletePlan = async (planId) => {
        if (Platform.OS === 'web' && !window.confirm("Deletar plano?")) return;
        try {
            const res = await fetch(`https://fitos-final.onrender.com/api/admin/saas-meta/plan?planId=${planId}`, {
                method: 'DELETE',
                headers: { ...(await authHeaders()) },
            });
            if (res.ok) fetchSaaSMeta(currentUserId);
        } catch (e) { Alert.alert("Erro", "Erro ao deletar."); }
    };

    if (loadingSaaS) return <ActivityIndicator size="large" color={theme.accent} style={{marginTop: 30}} />;

    return (
        <View style={{gap: 15}}>
            {/* 1. CONFIG BÁSICA */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>1. CONFIGURAÇÃO BÁSICA</Text>
                <Text style={[styles.inputLabel, {color: theme.textSecondary, marginTop: 10}]}>Título Principal da Página</Text>
                <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} value={pageTitle} onChangeText={setPageTitle} placeholder="Ex: Consultoria Online - Coach Pro" placeholderTextColor="#666" />
                <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 20 }} />
                <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Sua Foto de Perfil (Autoridade)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 5, marginBottom: 15 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                        {coachPhotoUrl ? <Image source={{ uri: coachPhotoUrl }} style={{ width: '100%', height: '100%' }} /> : <MaterialCommunityIcons name="account-tie" size={40} color={theme.textSecondary} />}
                    </View>
                    <TouchableOpacity style={{ backgroundColor: theme.surface, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: themeColor }} onPress={handlePickCoachPhoto} disabled={uploadingSlot === 'coachPhoto'}>
                        {uploadingSlot === 'coachPhoto' ? <ActivityIndicator color={themeColor} size="small" /> : <Text style={{ color: themeColor, fontSize: 12, fontWeight: 'bold' }}>{coachPhotoUrl ? 'TROCAR FOTO' : 'ADICIONAR FOTO'}</Text>}
                    </TouchableOpacity>
                    {coachPhotoUrl ? <TouchableOpacity onPress={() => setCoachPhotoUrl('')}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" /></TouchableOpacity> : null}
                </View>
                <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Sua Biografia / Sobre Você</Text>
                <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, height: 80}]} multiline numberOfLines={3} value={aboutText} onChangeText={setAboutText} placeholder="Conte sua metodologia e conquistas..." placeholderTextColor="#666" />
                <View style={{ width: '100%', height: 1, backgroundColor: theme.border, marginVertical: 20 }} />
                <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Vídeo de Apresentação (Shorts ou Normal)</Text>
                <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} value={videoUrl} onChangeText={setVideoUrl} placeholder="Link do YouTube" placeholderTextColor="#666" />
            </View>

            {/* 2. DESIGN E FUNCIONALIDADES */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>2. DESIGN E FUNCIONALIDADES</Text>
                <Text style={[styles.inputLabel, {color: theme.textSecondary, marginTop: 10}]}>Cor Principal</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 }}>
                    {PREDEFINED_COLORS.map(c => <TouchableOpacity key={c.hex} onPress={() => setThemeColor(c.hex)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.hex, borderWidth: 3, borderColor: themeColor === c.hex ? theme.text : 'transparent' }} />)}
                </View>
                <Text style={[styles.inputLabel, {color: theme.textSecondary, marginTop: 25}]}>O que exibir como benefício?</Text>
                <View style={{ gap: 10, marginTop: 5 }}>
                    {AVAILABLE_FEATURES.map(feat => (
                        <TouchableOpacity key={feat.id} onPress={() => toggleFeature(feat.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <MaterialCommunityIcons name={appFeatures.includes(feat.id) ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={appFeatures.includes(feat.id) ? themeColor : theme.textSecondary} />
                            <MaterialCommunityIcons name={feat.icon} size={18} color={theme.textSecondary} /><Text style={{ color: theme.text, fontSize: 13 }}>{feat.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 3. PROVA SOCIAL */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text, marginBottom: 0 }]}>3. RESULTADOS DE ALUNOS</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 5, marginBottom: 15 }}>Monte 4 comparações de Antes/Depois.</Text>
                <View style={{ width: '100%', gap: 20 }}>
                    {galleryPairs.map((pair, index) => (
                        <View key={pair.id} style={{ backgroundColor: theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                                    {pair.before ? (
                                        <View style={{ width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden' }}><Image source={{ uri: pair.before }} style={{ width: '100%', height: '100%' }} /><TouchableOpacity style={styles.closeFloatBtn} onPress={() => removeGalleryPhoto(index, 'before')}><MaterialCommunityIcons name="close" size={14} color="#FFF" /></TouchableOpacity></View>
                                    ) : <TouchableOpacity style={[styles.emptyPhotoBox, { borderColor: themeColor }]} onPress={() => handlePickGalleryPhoto(index, 'before')}><MaterialCommunityIcons name="camera-plus" size={24} color={themeColor} /></TouchableOpacity>}
                                </View>
                                <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                                    {pair.after ? (
                                        <View style={{ width: '100%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: themeColor }}><Image source={{ uri: pair.after }} style={{ width: '100%', height: '100%' }} /><TouchableOpacity style={styles.closeFloatBtn} onPress={() => removeGalleryPhoto(index, 'after')}><MaterialCommunityIcons name="close" size={14} color="#FFF" /></TouchableOpacity></View>
                                    ) : <TouchableOpacity style={[styles.emptyPhotoBox, { borderColor: themeColor }]} onPress={() => handlePickGalleryPhoto(index, 'after')}><MaterialCommunityIcons name="camera-plus" size={24} color={themeColor} /></TouchableOpacity>}
                                </View>
                            </View>
                            <TextInput style={[styles.saasInput, {backgroundColor: theme.surface, color: theme.text, borderColor: theme.border}]} placeholder="Ex: Ana perdeu 12kg..." placeholderTextColor="#666" value={pair.text} onChangeText={(val) => handleGalleryTextChange(index, val)} />
                        </View>
                    ))}
                </View>
            </View>

            {/* 4. DEPOIMENTOS */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text, marginBottom: 0 }]}>4. DEPOIMENTOS</Text>
                <View style={{ width: '100%', gap: 15, marginTop: 15 }}>
                    {testimonials.map((test, index) => (
                        <View key={test.id} style={{ backgroundColor: theme.bg, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <TextInput style={[styles.saasInput, {backgroundColor: theme.surface, color: theme.text, borderColor: theme.border, marginBottom: 8, height: 60}]} multiline placeholder={`"Melhor consultoria..."`} placeholderTextColor="#666" value={test.text} onChangeText={(val) => handleTestimonialChange(index, 'text', val)} />
                            <TextInput style={[styles.saasInput, {backgroundColor: theme.surface, color: theme.text, borderColor: theme.border}]} placeholder="Nome (Ex: João Pedro)" placeholderTextColor="#666" value={test.name} onChangeText={(val) => handleTestimonialChange(index, 'name', val)} />
                        </View>
                    ))}
                </View>
            </View>

            {/* 5. PIX */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start' }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>5. PAGAMENTO PIX (GERAL)</Text>
                <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Sua Chave PIX</Text>
                <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, marginBottom: 15}]} value={pixKey} onChangeText={setPixKey} placeholder="Sua chave PIX exata..." placeholderTextColor="#666" />
                <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Nome do Beneficiário</Text>
                <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} value={pixName} onChangeText={setPixName} placeholder="Ex: João da Silva ME" placeholderTextColor="#666" />
            </View>

            <TouchableOpacity style={[styles.saveBrandBtn, { backgroundColor: themeColor, marginTop: 5, padding: 16 }]} onPress={handleSaveSalesPage}>
                <Text style={[styles.saveBrandBtnText, { color: '#000', fontSize: 14 }]}>SALVAR TODA A PÁGINA</Text>
            </TouchableOpacity>

            {/* 6. PLANOS */}
            <View style={[styles.bigCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'flex-start', marginTop: 10 }]}>
                <Text style={[styles.bigCardTitle, { color: theme.text }]}>💰 MEUS PLANOS COMERCIAIS</Text>
                <View style={{flexDirection: 'row', gap: 8, width: '100%', marginTop: 15}}>
                    <Text style={[styles.inputLabel, {flex: 2, color: theme.textSecondary}]}>Nome</Text>
                    <Text style={[styles.inputLabel, {flex: 1, color: theme.textSecondary}]}>R$ Base</Text>
                    <Text style={[styles.inputLabel, {flex: 0.8, color: theme.textSecondary}]}>Meses</Text>
                    <Text style={[styles.inputLabel, {flex: 1, color: theme.textSecondary}]}>% Desc.</Text>
                </View>
                <View style={{flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10}}>
                    <TextInput style={[styles.saasInput, {flex: 2, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} value={planName} onChangeText={setPlanName} placeholder="Ex: Anual" placeholderTextColor="#666" />
                    <TextInput style={[styles.saasInput, {flex: 1, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} keyboardType="numeric" value={planValue} onChangeText={setPlanValue} placeholder="1200" placeholderTextColor="#666" />
                    <TextInput style={[styles.saasInput, {flex: 0.8, backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, textAlign: 'center'}]} keyboardType="numeric" value={planMonths} onChangeText={setPlanMonths} placeholder="12" placeholderTextColor="#666" />
                    <TextInput style={[styles.saasInput, {flex: 1, backgroundColor: theme.bg, color: theme.accent, borderColor: theme.accent, textAlign: 'center', fontWeight: 'bold'}]} keyboardType="numeric" value={planDiscount} onChangeText={setPlanDiscount} placeholder="0%" placeholderTextColor="#666" />
                </View>

                <View style={{flexDirection: 'row', gap: 8, width: '100%', marginBottom: 15, alignItems: 'flex-end'}}>
                    <View style={{flex: 1}}>
                        <Text style={[styles.inputLabel, {color: theme.textSecondary}]}>Link de Pagamento Externo (Opcional)</Text>
                        <TextInput style={[styles.saasInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]} value={planPaymentUrl} onChangeText={setPlanPaymentUrl} placeholder="https://pay.hotmart.com/..." placeholderTextColor="#666" />
                    </View>
                    <TouchableOpacity style={[styles.addPlanBtn, {backgroundColor: planIdEditing ? theme.accent : themeColor, height: 46}]} onPress={handleAddOrUpdatePlan}>
                        <MaterialCommunityIcons name={planIdEditing ? "check" : "plus"} size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                {planIdEditing && (
                    <TouchableOpacity onPress={cancelEditingPlan} style={{ alignSelf: 'flex-end', marginBottom: 15, marginTop: -10 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: 'bold' }}>Cancelar Edição</Text>
                    </TouchableOpacity>
                )}

                {plans.map((plan) => {
                    const hasDiscount = plan.discountPerc > 0;
                    const finalPrice = hasDiscount ? (plan.value - (plan.value * (plan.discountPerc / 100))) : plan.value;
                    return (
                        <View key={plan.id} style={[styles.planListItem, {borderColor: theme.border, backgroundColor: theme.bg}]}>
                            <View style={{flex: 1}}>
                                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                                    <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 13}}>{plan.name}</Text>
                                    {hasDiscount && <View style={{backgroundColor: themeColor, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5}}><Text style={{color: '#000', fontSize: 9, fontWeight: 'bold'}}>{plan.discountPerc}% OFF</Text></View>}
                                </View>
                                <Text style={{color: theme.textSecondary, fontSize: 11}}>{plan.durationInMonths} {plan.durationInMonths === 1 ? 'Mês' : 'Meses'}</Text>
                            </View>
                            <View style={{alignItems: 'flex-end', marginRight: 15}}>
                                {hasDiscount && <Text style={{color: theme.textSecondary, fontSize: 10, textDecorationLine: 'line-through'}}>De R$ {plan.value.toFixed(2)}</Text>}
                                <Text style={{color: themeColor, fontWeight: '900', fontSize: 14}}>R$ {finalPrice.toFixed(2)}</Text>
                            </View>
                            <View style={{flexDirection: 'row', gap: 10}}>
                                <TouchableOpacity onPress={() => startEditingPlan(plan)}><MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} /></TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeletePlan(plan.id)}><MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" /></TouchableOpacity>
                            </View>
                        </View>
                    )
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bigCard: { padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', width: '100%', marginBottom: 15 }, 
    bigCardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
    inputLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
    saasInput: { width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13 },
    closeFloatBtn: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 2 },
    emptyPhotoBox: { width: '100%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    saveBrandBtn: { width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    saveBrandBtnText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
    addPlanBtn: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    planListItem: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 6 },
});