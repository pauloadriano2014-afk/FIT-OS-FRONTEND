// src/components/AdminDiet/CreateFoodModal.js
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BASE_URL, CATEGORIES } from '../../constants/foodManagerConstants';
import { authHeaders } from '../../utils/authToken';

export default function CreateFoodModal({ visible, onClose, onCreated, coachId, theme }) {
    const EMPTY = { name:'', category:'Carnes e Proteínas', subcategory:'', baseUnit:'g', kcal:'', protein:'', carbs:'', fat:'', fiber:'' };
    const [form,   setForm]   = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const field = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.name.trim())   e.name    = 'Obrigatório';
        if (form.kcal === '')    e.kcal    = 'Obrigatório';
        if (form.protein === '') e.protein = 'Obrigatório';
        if (form.carbs === '')   e.carbs   = 'Obrigatório';
        if (form.fat === '')     e.fat     = 'Obrigatório';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            // 🔥 CORRIGIDO: faltava o token JWT -- rota travada por auth, dava 401
            // e "cadastrar alimento" nunca salvava.
            const res = await fetch(`${BASE_URL}/api/food`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
                body: JSON.stringify({
                    coachId,
                    name:        form.name,
                    category:    form.category,
                    subcategory: form.subcategory || null,
                    baseUnit:    form.baseUnit,
                    kcal:        parseFloat(form.kcal),
                    protein:     parseFloat(form.protein),
                    carbs:       parseFloat(form.carbs),
                    fat:         parseFloat(form.fat),
                    fiber:       form.fiber ? parseFloat(form.fiber) : null,
                }),
            });
            if (!res.ok) throw new Error('Erro ao criar');
            const created = await res.json();
            onCreated(created);
            setForm(EMPTY);
            setErrors({});
            onClose();
        } catch (e) {
            Alert.alert('Erro', e.message);
        } finally {
            setSaving(false);
        }
    };

    const MacroInput = ({ label, fieldKey, color }) => (
        <View style={{ flex:1 }}>
            <Text style={{ color, fontSize:9, fontWeight:'900', marginBottom:4, letterSpacing:0.5 }}>
                {label}{errors[fieldKey] ? ' *' : ''}
            </Text>
            <TextInput
                style={[s.macroInput, { backgroundColor:theme.bg, borderColor: errors[fieldKey] ? '#FF3B30' : theme.border, color:theme.text }]}
                value={form[fieldKey]}
                onChangeText={field(fieldKey)}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
            />
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={s.backdrop}>
                <View style={[s.sheet, { backgroundColor:theme.bg, borderColor:theme.border }]}>
                    <View style={s.header}>
                        <View>
                            <Text style={[s.title, { color:theme.text }]}>NOVO ALIMENTO</Text>
                            <Text style={{ color:theme.textSecondary, fontSize:11, marginTop:2 }}>
                                Fica visível só para você e seus alunos
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:20 }}>
                        {/* Nome */}
                        <Text style={[s.label, { color:theme.textSecondary }]}>NOME *{errors.name ? ` — ${errors.name}` : ''}</Text>
                        <TextInput
                            style={[s.input, { backgroundColor:theme.bg, borderColor: errors.name ? '#FF3B30' : theme.border, color:theme.text }]}
                            value={form.name}
                            onChangeText={field('name')}
                            placeholder="Ex: Frango Grelhado Temperado"
                            placeholderTextColor={theme.textSecondary}
                        />

                        {/* Categoria */}
                        <Text style={[s.label, { color:theme.textSecondary }]}>CATEGORIA</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:14 }}>
                            <View style={{ flexDirection:'row', gap:8 }}>
                                {CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                                    <TouchableOpacity key={cat}
                                        style={[s.catPill, { borderColor: form.category===cat ? theme.accent : theme.border, backgroundColor: form.category===cat ? theme.accent+'20' : theme.surface }]}
                                        onPress={() => field('category')(cat)}
                                    >
                                        <Text style={{ fontSize:11, fontWeight:'800', color: form.category===cat ? theme.accent : theme.textSecondary }}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Subcategoria */}
                        <Text style={[s.label, { color:theme.textSecondary }]}>SUBCATEGORIA</Text>
                        <TextInput
                            style={[s.input, { backgroundColor:theme.bg, borderColor:theme.border, color:theme.text }]}
                            value={form.subcategory}
                            onChangeText={field('subcategory')}
                            placeholder="Ex: Proteínas Gerais"
                            placeholderTextColor={theme.textSecondary}
                        />

                        {/* Unidade */}
                        <Text style={[s.label, { color:theme.textSecondary }]}>UNIDADE BASE</Text>
                        <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
                            {['g','ml','un'].map(u => (
                                <TouchableOpacity key={u}
                                    style={[s.unitPill, { borderColor: form.baseUnit===u ? theme.accent : theme.border, backgroundColor: form.baseUnit===u ? theme.accent+'20' : theme.surface }]}
                                    onPress={() => field('baseUnit')(u)}
                                >
                                    <Text style={{ fontWeight:'900', color: form.baseUnit===u ? theme.accent : theme.textSecondary }}>{u}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Macros */}
                        <Text style={[s.label, { color:theme.textSecondary }]}>MACROS POR 100{form.baseUnit} *</Text>
                        <View style={{ flexDirection:'row', gap:10 }}>
                            <MacroInput label="KCAL"  fieldKey="kcal"    color="#FFCC00" />
                            <MacroInput label="PROT"  fieldKey="protein" color="#32ADE6" />
                            <MacroInput label="CARBO" fieldKey="carbs"   color="#FF9500" />
                            <MacroInput label="GORD"  fieldKey="fat"     color="#AF52DE" />
                        </View>

                        {/* Fibra */}
                        <View style={{ marginTop:10 }}>
                            <Text style={[s.label, { color:theme.textSecondary }]}>FIBRA (opcional)</Text>
                            <TextInput
                                style={[s.macroInput, { backgroundColor:theme.bg, borderColor:theme.border, color:theme.text, width:'25%' }]}
                                value={form.fiber}
                                onChangeText={field('fiber')}
                                keyboardType="decimal-pad"
                                placeholder="0"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        {/* Info */}
                        <View style={[s.infoCard, { backgroundColor:theme.accent+'10', borderColor:theme.accent+'30', marginTop:16 }]}>
                            <MaterialCommunityIcons name="information-outline" size={15} color={theme.accent} />
                            <Text style={{ flex:1, color:theme.textSecondary, fontSize:12, lineHeight:18 }}>
                                Alimentos criados por você entram automaticamente como Favoritos e ficam visíveis quando você monta dietas.
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[s.saveBtn, { backgroundColor:theme.accent, marginTop:16 }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving
                                ? <ActivityIndicator color="#000" />
                                : <Text style={{ fontWeight:'900', fontSize:14, color:'#000' }}>SALVAR ALIMENTO</Text>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop:  { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
    sheet:     { borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1, padding:24, maxHeight:'90%' },
    header:    { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 },
    title:     { fontSize:16, fontWeight:'900', letterSpacing:1 },
    label:     { fontSize:11, fontWeight:'800', marginBottom:5, letterSpacing:0.5 },
    input:     { borderWidth:1, borderRadius:12, padding:14, fontSize:14, marginBottom:14 },
    macroInput:{ borderWidth:1, borderRadius:12, padding:12, fontSize:16, fontWeight:'900', textAlign:'center' },
    catPill:   { paddingHorizontal:12, paddingVertical:7, borderRadius:20, borderWidth:1 },
    unitPill:  { flex:1, paddingVertical:10, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center' },
    saveBtn:   { padding:16, borderRadius:16, alignItems:'center', justifyContent:'center' },
    infoCard:  { flexDirection:'row', alignItems:'flex-start', gap:8, padding:12, borderRadius:12, borderWidth:1 },
});