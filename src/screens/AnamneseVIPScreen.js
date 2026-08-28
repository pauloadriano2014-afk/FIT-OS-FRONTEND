import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { authHeaders } from '../utils/authToken';

// OPÇÕES FIXAS (VIP COMPLETO)
const LIMITACOES = ['Joelho', 'Lombar', 'Ombro', 'Punho', 'Quadril', 'Tornozelo', 'Cervical', 'Cotovelos', 'Nenhuma'];
const CIRURGIAS_LIST = ['Abdominoplastia', 'Prótese de Silicone', 'Cesárea', 'LCA/Menisco', 'Hérnia', 'Coluna', 'Manguito', 'Nenhuma'];

// OBJETIVOS VIP (Completo)
const OBJETIVOS = ['Hipertrofia', 'Emagrecimento', 'Definição', 'Performance', 'Fisiculturismo'];

// NÍVEIS VIP (Completo)
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado', 'Atleta'];

// NUTRIÇÃO
const ALERGIAS = ['Lactose', 'Glúten', 'Amendoim', 'Frutos do Mar', 'Ovo', 'Leite', 'Nenhuma'];
const SUPLEMENTOS = ['Whey Protein', 'Creatina', 'Cafeína', 'Multivitamínico', 'Beta-Alanina', 'Nenhum'];

export default function AnamneseVIPScreen({ route, navigation }) {
  const { userData } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    peso: '', altura: '', objetivo: '', nivel: '',
    limitacoes: [], cirurgias: [], frequencia: '', tempoDisponivel: '',
    refeicoesDia: '', alergias: [], suplementos: [], aversao: ''
  });

  const toggleSelection = (field, item) => {
    setForm(prev => {
      const list = prev[field];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      } else {
        if (item === 'Nenhuma' || item === 'Nenhum') return { ...prev, [field]: [item] };
        // Remove 'Nenhuma' se selecionar algo específico
        const cleanList = list.filter(i => i !== 'Nenhuma' && i !== 'Nenhum');
        return { ...prev, [field]: [...cleanList, item] };
      }
    });
  };

  const salvarVIP = async () => {
    setLoading(true);
    try {
      // Cálculos Básicos
      const p = parseFloat(form.peso.replace(',', '.'));
      const a = parseFloat(form.altura.replace(',', '.'));
      const alturaMetros = a / 100;
      const imcCalc = (p / (alturaMetros * alturaMetros)).toFixed(2);
      const aguaCalc = (p * 35).toFixed(0);

      const payload = {
        userId: userData.id,
        peso: p,
        altura: a,
        imc: parseFloat(imcCalc),
        aguaIdeal: parseFloat(aguaCalc),
        objetivo: form.objetivo,
        nivel: form.nivel,
        frequencia: parseInt(form.frequencia),
        tempoDisponivel: parseInt(form.tempoDisponivel),
        limitacoes: form.limitacoes,
        cirurgias: form.cirurgias,
        // VIP FIELDS
        refeicoesDia: parseInt(form.refeicoesDia),
        alergias: form.alergias,
        suplementos: form.suplementos,
        alimentosAversao: form.aversao ? [form.aversao] : [] // Salvando como array
      };

      console.log("Enviando VIP Payload:", payload);

      const authHdrs = await authHeaders();
      const res = await fetch('https://fitos-final.onrender.com/api/anamnese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHdrs },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Gera o treino OCULTO (isVisible: false)
        await fetch('https://fitos-final.onrender.com/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHdrs },
            body: JSON.stringify({ userId: userData.id })
        });

        Alert.alert(
            "Recebido, VIP! 💎", 
            "Seus dados foram enviados para o Personal Paulo Adriano.\n\nSua ficha e dieta estão em análise. Aguarde a notificação de liberação.",
            [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main', params: { userData } }] }) }]
        );
      } else {
        Alert.alert("Erro", "Falha ao salvar. Verifique se preencheu tudo.");
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Erro de Conexão", "Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Componente de Botão de Seleção (Para limpar o código)
  const SelectBtn = ({ label, selected, onPress }) => (
    <TouchableOpacity onPress={onPress} style={[styles.btn, selected && styles.active]}>
       <Text style={[styles.btnT, selected && {color: '#000'}]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        
        <View style={styles.header}>
            <Text style={styles.vipTitle}>CONSULTORIA <Text style={{color:'#CCFF00'}}>VIP</Text></Text>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, {width: `${step * 20}%`}]} />
            </View>
            <Text style={styles.stepText}>Etapa {step} de 5</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
            {/* ETAPA 1: BIO */}
            {step === 1 && (
                <View>
                    <Text style={styles.q}>Bioimpedância Estimada</Text>
                    <View style={styles.row}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>PESO (KG)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="80" placeholderTextColor="#555" onChangeText={v=>setForm({...form, peso:v})} value={form.peso}/>
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>ALTURA (CM)</Text>
                            <TextInput style={styles.input} keyboardType="numeric" placeholder="175" placeholderTextColor="#555" onChangeText={v=>setForm({...form, altura:v})} value={form.altura}/>
                        </View>
                    </View>
                </View>
            )}

            {/* ETAPA 2: OBJETIVO (VIP COMPLETO) */}
            {step === 2 && (
                <View>
                    <Text style={styles.q}>Objetivo Principal</Text>
                    <View style={styles.grid}>
                        {OBJETIVOS.map(o => (
                            <SelectBtn key={o} label={o} selected={form.objetivo === o} onPress={()=>setForm({...form, objetivo:o})} />
                        ))}
                    </View>

                    <Text style={[styles.q, {marginTop:30}]}>Nível de Experiência</Text>
                    <View style={styles.grid}>
                        {NIVEIS.map(n => (
                            <SelectBtn key={n} label={n} selected={form.nivel === n} onPress={()=>setForm({...form, nivel:n})} />
                        ))}
                    </View>
                </View>
            )}

            {/* ETAPA 3: SAÚDE */}
            {step === 3 && (
                <View>
                    <Text style={styles.q}>Mapeamento de Dores</Text>
                    <View style={styles.wrapGrid}>
                        {LIMITACOES.map(l => (
                             <TouchableOpacity key={l} onPress={()=>toggleSelection('limitacoes', l)} style={[styles.chip, form.limitacoes.includes(l) && styles.activeChip]}>
                                 <Text style={[styles.chipT, form.limitacoes.includes(l) && {color:'#000'}]}>{l}</Text>
                             </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.q, {marginTop:30}]}>Cirurgias Prévias</Text>
                    <View style={styles.wrapGrid}>
                        {CIRURGIAS_LIST.map(c => (
                             <TouchableOpacity key={c} onPress={()=>toggleSelection('cirurgias', c)} style={[styles.chip, form.cirurgias.includes(c) && styles.activeChip]}>
                                 <Text style={[styles.chipT, form.cirurgias.includes(c) && {color:'#000'}]}>{c}</Text>
                             </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* ETAPA 4: ROTINA */}
            {step === 4 && (
                <View>
                    <Text style={styles.q}>Disponibilidade</Text>
                    <Text style={styles.label}>Dias por semana (1 a 7)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 5" placeholderTextColor="#555" onChangeText={v=>setForm({...form, frequencia:v})} value={form.frequencia} />
                    
                    <Text style={styles.label}>Tempo por treino (minutos)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 60" placeholderTextColor="#555" onChangeText={v=>setForm({...form, tempoDisponivel:v})} value={form.tempoDisponivel} />
                </View>
            )}

            {/* ETAPA 5: NUTRIÇÃO (VIP) */}
            {step === 5 && (
                <View>
                    <Text style={styles.q}>Nutrição & Hábitos</Text>
                    
                    <Text style={styles.label}>Quantas refeições faz por dia?</Text>
                    <TextInput style={styles.input} keyboardType="numeric" placeholder="Ex: 3" placeholderTextColor="#555" onChangeText={v=>setForm({...form, refeicoesDia:v})} value={form.refeicoesDia} />

                    <Text style={styles.label}>Alimentos que NÃO gosta (Aversão)</Text>
                    <TextInput style={styles.input} placeholder="Ex: Fígado, Jiló..." placeholderTextColor="#555" onChangeText={v=>setForm({...form, aversao:v})} value={form.aversao} />

                    <Text style={[styles.label, {marginTop:20}]}>Possui Alergias?</Text>
                    <View style={styles.wrapGrid}>
                        {ALERGIAS.map(a => (
                            <TouchableOpacity key={a} onPress={()=>toggleSelection('alergias', a)} style={[styles.chip, form.alergias.includes(a) && styles.activeChip]}>
                                <Text style={[styles.chipT, form.alergias.includes(a) && {color:'#000'}]}>{a}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, {marginTop:20}]}>Suplementação Atual</Text>
                    <View style={styles.wrapGrid}>
                        {SUPLEMENTOS.map(s => (
                            <TouchableOpacity key={s} onPress={()=>toggleSelection('suplementos', s)} style={[styles.chip, form.suplementos.includes(s) && styles.activeChip]}>
                                <Text style={[styles.chipT, form.suplementos.includes(s) && {color:'#000'}]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.finishBtn} onPress={salvarVIP} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000"/> : <Text style={styles.finishText}>ENVIAR PARA O PERSONAL</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>

        {/* NAVEGAÇÃO */}
        {step < 5 && (
            <View style={styles.footer}>
                {step > 1 ? (
                    <TouchableOpacity onPress={()=>setStep(step-1)} style={styles.backBtn}><Text style={{color:'#FFF', fontWeight:'bold'}}>VOLTAR</Text></TouchableOpacity>
                ) : <View style={{flex:1}}/>}
                <TouchableOpacity onPress={()=>setStep(step+1)} style={styles.nextBtn}><Text style={{color:'#000', fontWeight:'bold'}}>PRÓXIMO</Text></TouchableOpacity>
            </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safe: {flex:1, backgroundColor:'#000'},
    header: {padding:20, paddingTop:40, backgroundColor:'#000'},
    vipTitle: {color:'#FFF', fontSize:20, fontWeight:'900', letterSpacing:1},
    stepText: {color:'#666', fontSize:10, fontWeight:'bold', marginTop:5, alignSelf:'flex-end'},
    progressBarBg: {height:4, backgroundColor:'#222', marginTop:15, borderRadius:2},
    progressBarFill: {height:4, backgroundColor:'#CCFF00', borderRadius:2},
    
    content: {padding:20, paddingBottom:100},
    q: {color:'#FFF', fontSize:22, fontWeight:'bold', marginBottom:15},
    label: {color:'#CCFF00', fontSize:10, fontWeight:'bold', marginBottom:8},
    input: {backgroundColor:'#111', color:'#FFF', padding:18, borderRadius:12, borderWidth:1, borderColor:'#333', fontSize:16, marginBottom:15},
    row: {flexDirection:'row', justifyContent:'space-between'},

    grid: {flexDirection:'row', flexWrap:'wrap', gap:10},
    btn: {padding:15, borderRadius:10, borderWidth:1, borderColor:'#333', backgroundColor:'#111', minWidth:'45%', flex:1, alignItems:'center'},
    active: {backgroundColor:'#CCFF00', borderColor:'#CCFF00'}, 
    btnT: {fontWeight:'bold', color:'#AAA', fontSize:12},
    
    wrapGrid: {flexDirection:'row', flexWrap:'wrap', gap:8},
    chip: {paddingVertical:10, paddingHorizontal:15, borderRadius:20, borderWidth:1, borderColor:'#333', backgroundColor:'#111'},
    activeChip: {backgroundColor:'#CCFF00', borderColor:'#CCFF00'},
    chipT: {color:'#AAA', fontWeight:'bold', fontSize:12},

    footer: {position:'absolute', bottom:0, width:'100%', flexDirection:'row', padding:20, backgroundColor:'#000', borderTopWidth:1, borderColor:'#222'},
    backBtn: {flex:1, padding:15, alignItems:'center', borderRadius:12, borderWidth:1, borderColor:'#333', marginRight:10},
    nextBtn: {flex:2, padding:15, alignItems:'center', borderRadius:12, backgroundColor:'#CCFF00'},
    
    finishBtn: {marginTop:40, backgroundColor:'#CCFF00', padding:20, borderRadius:15, alignItems:'center'},
    finishText: {color:'#000', fontWeight:'900', fontSize:16}
});