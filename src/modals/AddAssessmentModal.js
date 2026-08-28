import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { calculateBodyFat, getAgeFromDate } from '../utils/calculations';
import { authHeaders } from '../utils/authToken';

export default function AddAssessmentModal({ visible, onClose, onSuccess, theme, aluno, isWeb }) {
    const [method, setMethod] = useState('BASICO');
    const [customDate, setCustomDate] = useState('');
    const [weight, setWeight] = useState('');
    const [currentAge, setCurrentAge] = useState(aluno.birthDate ? getAgeFromDate(aluno.birthDate) : '');
    const [currentGender, setCurrentGender] = useState(aluno.gender ? aluno.gender.toUpperCase() : 'MASCULINO');
    const [measures, setMeasures] = useState({ waist: '', abdomen: '' });
    const [folds, setFolds] = useState({ chest:'', axillary:'', triceps:'', subscapular:'', abdominal:'', suprailiac:'', thigh:'' });

    // Mapeamento para exibir em PT-BR mas salvar em Inglês no Banco de Dados
    const foldsConfig = [
        { key: 'chest', label: 'PEITORAL' },
        { key: 'axillary', label: 'AXILAR' },
        { key: 'triceps', label: 'TRÍCEPS' },
        { key: 'subscapular', label: 'SUBESCAPULAR' },
        { key: 'abdominal', label: 'ABDOMINAL' },
        { key: 'suprailiac', label: 'SUPRAILÍACA' },
        { key: 'thigh', label: 'COXA' }
    ];

    const handleSave = async () => {
        if (!weight) return Alert.alert("Erro", "Peso é obrigatório.");
        
        let isoDate = new Date().toISOString();
        if (customDate) {
            if(customDate.length !== 10) return Alert.alert("Erro", "Data inválida");
            const [d, m, y] = customDate.split('/');
            isoDate = new Date(`${y}-${m}-${d}T12:00:00`).toISOString();
        }

        let calculatedBF = null;
        if (method === 'POLLOCK') {
            if (!currentAge) return Alert.alert("Erro", "Idade necessária.");
            const cleanFolds = {};
            Object.keys(folds).forEach(k => cleanFolds[k] = String(folds[k]).replace(',', '.'));
            calculatedBF = calculateBodyFat(currentGender, currentAge, cleanFolds);
        }

        const payload = {
            userId: aluno.id,
            date: isoDate,
            weight: weight.replace(',', '.'),
            method,
            measures: method === 'BASICO' ? measures : {},
            folds: method === 'POLLOCK' ? folds : {},
            bodyFat: calculatedBF
        };

        try {
            const res = await fetch('https://fitos-final.onrender.com/api/assessment', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', ...(await authHeaders())},
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                Alert.alert("Sucesso", "Avaliação registrada!");
                setWeight('');
                setCustomDate('');
                setFolds({ chest:'', axillary:'', triceps:'', subscapular:'', abdominal:'', suprailiac:'', thigh:'' });
                setMeasures({ waist: '', abdomen: '' });
                onSuccess();
            } else {
                Alert.alert("Erro", "Falha ao salvar.");
            }
        } catch (e) { Alert.alert("Erro", e.message); }
    };

    return (
        <Modal visible={visible} animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center' }}>
                <SafeAreaView style={{ flex:1, width: '100%', maxWidth: isWeb ? 480 : '100%', ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>REGISTRAR DADOS</Text>
                        <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{padding:20}}>
                        <Text style={[styles.inputLabel, { color: theme.accent }]}>DATA (Opcional)</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} placeholder="DD/MM/AAAA" placeholderTextColor={theme.textSecondary} value={customDate} onChangeText={(t) => {
                            let v = t.replace(/[^0-9]/g, '');
                            if(v.length>2) v = v.slice(0,2)+'/'+v.slice(2);
                            if(v.length>5) v = v.slice(0,5)+'/'+v.slice(5);
                            if(v.length>10) v = v.slice(0,10);
                            setCustomDate(v);
                        }} keyboardType="numeric" maxLength={10}/>

                        <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
                            <TouchableOpacity style={[styles.switchBtn, method==='BASICO' && {backgroundColor: theme.accent}]} onPress={()=>setMethod('BASICO')}><Text style={[styles.switchText, method==='BASICO' && {color: theme.isDark ? '#000' : '#FFF'}]}>BÁSICO</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.switchBtn, method==='POLLOCK' && {backgroundColor: theme.accent}]} onPress={()=>setMethod('POLLOCK')}><Text style={[styles.switchText, method==='POLLOCK' && {color: theme.isDark ? '#000' : '#FFF'}]}>POLLOCK 7</Text></TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.accent }]}>PESO (KG)</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" value={weight} onChangeText={setWeight} />

                        {method === 'BASICO' ? (
                            <>
                                <Text style={[styles.inputLabel, { color: theme.accent }]}>CINTURA (CM)</Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, waist:t})} />
                                <Text style={[styles.inputLabel, { color: theme.accent }]}>ABDÔMEN (CM)</Text>
                                <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t=>setMeasures({...measures, abdomen:t})} />
                            </>
                        ) : (
                            <>
                                <View style={{flexDirection:'row', gap:10, marginBottom:15}}>
                                    <View style={{flex:1}}><Text style={[styles.inputLabel, { color: theme.accent }]}>IDADE</Text><TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={currentAge} onChangeText={setCurrentAge} /></View>
                                    <View style={{flex:1}}><Text style={[styles.inputLabel, { color: theme.accent }]}>SEXO</Text><TouchableOpacity style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent:'center' }]} onPress={()=>setCurrentGender(currentGender==='MASCULINO'?'FEMININO':'MASCULINO')}><Text style={{color: theme.text}}>{currentGender}</Text></TouchableOpacity></View>
                                </View>
                                <Text style={{color: theme.accent, fontWeight:'bold', marginBottom:10}}>DOBRAS (MM)</Text>
                                <View style={{flexDirection:'row', flexWrap:'wrap', gap:10}}>
                                    {foldsConfig.map(({ key, label }) => (
                                        <View key={key} style={{width:'30%'}}>
                                            <Text style={{color: theme.textSecondary, fontSize:10, marginBottom:2}}>{label}</Text>
                                            <TextInput style={[styles.miniInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} keyboardType="numeric" onChangeText={t => setFolds(prev => ({...prev, [key]: t}))} />
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}

                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={handleSave}>
                            <Text style={{fontWeight:'900', fontSize:16, color: theme.isDark ? '#000' : '#FFF'}}>SALVAR NO PERFIL</Text>
                        </TouchableOpacity>
                        <View style={{height:50}}/>
                    </ScrollView>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalHeader: { padding:20, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, marginTop: Platform.OS === 'android' ? 20 : 0 },
    modalTitle: { fontWeight:'bold', fontSize:18 },
    inputLabel: { fontSize:12, fontWeight:'bold', marginBottom:5, marginTop:10 },
    input: { padding:12, borderRadius:8, borderWidth:1 },
    switchRow: { flexDirection:'row', borderRadius:8, padding:4, marginTop:10 },
    switchBtn: { flex:1, padding:10, alignItems:'center', borderRadius:6 },
    switchText: { fontWeight:'bold', fontSize:12 },
    miniInput: { padding:8, borderRadius:6, borderWidth:1, textAlign:'center' },
    saveBtn: { padding:15, borderRadius:10, alignItems:'center', marginTop:30 },
});