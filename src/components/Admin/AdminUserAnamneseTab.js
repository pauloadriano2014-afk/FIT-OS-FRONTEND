// src/components/Admin/AdminUserAnamneseTab.js — VERSÃO 3.0 MODULAR
// Usa os primitivos da pasta Anamnese/ para evitar duplicação de código
import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ActivityIndicator, Alert, Platform, ScrollView, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Primitivos compartilhados com a AnamneseScreen do aluno ─────────────────
// Nota: AdminAnamnese usa os mesmos chips/inputs — sem duplicação
import useAdminAnamneseForm  from '../../Anamnese/useAdminAnamneseForm';
import AdminAnamneseTimePicker from './AdminAnamneseTimePicker';
import AdminAnamneseSections   from './AdminAnamneseSections';

export default function AdminUserAnamneseTab({ theme, aluno, userPlan }) {
    const { f, set, toggleMulti, loading, saving, handleSave,
            timePicker, setTimePicker, missingModal, setMissingModal, missingFields }
        = useAdminAnamneseForm({ aluno });

    if (loading) return (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:50 }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ color:theme.textSecondary, marginTop:15, fontWeight:'bold' }}>
                Carregando ficha clínica...
            </Text>
        </View>
    );

    return (
        <View style={s.container}>
            {/* TIME PICKER */}
            <AdminAnamneseTimePicker
                timePicker={timePicker}
                f={f}
                set={set}
                setTimePicker={setTimePicker}
                theme={theme}
            />

            {/* SEÇÕES DO FORMULÁRIO */}
            <AdminAnamneseSections
                f={f}
                set={set}
                toggleMulti={toggleMulti}
                setTimePicker={setTimePicker}
                theme={theme}
                aluno={aluno}
            />

            {/* BOTÃO SALVAR */}
            <TouchableOpacity
                style={[s.saveBtn, { backgroundColor:theme.accent, opacity:saving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={saving}
            >
                {saving
                    ? <ActivityIndicator size="small" color="#000" />
                    : <>
                        <MaterialCommunityIcons name="content-save-check" size={24} color="#000" />
                        <Text style={[s.saveBtnText, { color:'#000' }]}>SALVAR REGISTRO E ANAMNESE</Text>
                      </>
                }
            </TouchableOpacity>

            {/* MODAL CAMPOS FALTANDO */}
            <MissingModal
                visible={missingModal}
                missingFields={missingFields}
                onClose={() => setMissingModal(false)}
                theme={theme}
            />
        </View>
    );
}

// ─── MODAL CAMPOS FALTANDO ────────────────────────────────────────────────────
function MissingModal({ visible, missingFields, onClose, theme }) {
    const softBg = theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={s.modalOverlay}>
                <View style={[s.modalBox, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={[s.modalHeader, { borderBottomColor:theme.border }]}>
                        <MaterialCommunityIcons name="alert-circle" size={24} color="#FF9500" />
                        <Text style={[s.modalTitle, { color:theme.text }]}>CAMPOS INCOMPLETOS</Text>
                        <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor:softBg }]}>
                            <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[s.modalSub, { color:theme.textSecondary }]}>
                        Preencha os campos abaixo antes de salvar:
                    </Text>
                    <ScrollView style={{ maxHeight:320 }} showsVerticalScrollIndicator={false}>
                        {Array.from(new Set(missingFields.map(m => m.section))).map(sec => (
                            <View key={sec} style={[s.missBlock, { borderColor:theme.border }]}>
                                <Text style={[s.missSec, { color:theme.accent }]}>{sec}</Text>
                                {missingFields.filter(m => m.section === sec).map((m, i) => (
                                    <View key={i} style={s.missRow}>
                                        <MaterialCommunityIcons name="circle-small" size={20} color="#FF9500" />
                                        <Text style={[s.missText, { color:theme.text }]}>{m.field}</Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={[s.modalBtn, { backgroundColor:theme.accent, marginTop:20 }]}
                        onPress={onClose}
                    >
                        <Text style={{ color:'#000', fontWeight:'900', fontSize:14 }}>
                            ENTENDI, VOU PREENCHER
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container:   { width:'100%', paddingBottom:40 },
    saveBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:12, padding:20, borderRadius:16, marginTop:10, elevation:4 },
    saveBtnText: { fontSize:15, fontWeight:'900', letterSpacing:1 },
    modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.65)', justifyContent:'center', alignItems:'center', padding:20 },
    modalBox:    { width:'100%', maxWidth:440, borderRadius:24, borderWidth:1, overflow:'hidden' },
    modalHeader: { flexDirection:'row', alignItems:'center', gap:10, padding:20, borderBottomWidth:1 },
    modalTitle:  { fontSize:15, fontWeight:'900', letterSpacing:0.5, flex:1 },
    closeBtn:    { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
    modalSub:    { fontSize:13, lineHeight:20, paddingHorizontal:20, paddingVertical:12 },
    missBlock:   { marginHorizontal:20, marginBottom:12, padding:12, borderRadius:12, borderWidth:1 },
    missSec:     { fontSize:11, fontWeight:'900', letterSpacing:0.8, marginBottom:8 },
    missRow:     { flexDirection:'row', alignItems:'center', marginBottom:4 },
    missText:    { fontSize:13, fontWeight:'600' },
    modalBtn:    { marginHorizontal:20, marginBottom:20, padding:16, borderRadius:14, alignItems:'center' },
});