// src/components/Admin/AdminAnamneseTimePicker.js
import React, { useState, useEffect, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default memo(function AdminAnamneseTimePicker({ timePicker, f, set, setTimePicker, theme }) {
    const parse = (t) => {
        if (!t?.includes(':')) return { h: 6, m: 0 };
        const [h, m] = t.split(':').map(Number);
        return { h: isNaN(h) ? 6 : h, m: isNaN(m) ? 0 : m };
    };

    const [hour, setHour] = useState(6);
    const [min,  setMin]  = useState(0);

    useEffect(() => {
        if (timePicker.visible) {
            const p = parse(f[timePicker.field]);
            setHour(p.h);
            setMin(p.m);
        }
    }, [timePicker.visible, timePicker.field]);

    const pad = (n) => String(n).padStart(2, '0');
    const bg  = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

    const onConfirm = () => {
        set(timePicker.field, `${pad(hour)}:${pad(min)}`);
        setTimePicker(p => ({ ...p, visible: false }));
    };

    const onClose = () => setTimePicker(p => ({ ...p, visible: false }));

    return (
        <Modal visible={timePicker.visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={tp.overlay}>
                <View style={[tp.box, { backgroundColor:theme.surface, borderColor:theme.border }]}>
                    <View style={[tp.header, { borderBottomColor:theme.border }]}>
                        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.accent} />
                        <Text style={[tp.title, { color:theme.text }]}>{timePicker.label}</Text>
                    </View>
                    <View style={tp.row}>
                        <View style={tp.col}>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor:bg }]} onPress={() => setHour(h => (h+1)%24)}>
                                <MaterialCommunityIcons name="chevron-up" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <View style={[tp.val, { backgroundColor:bg }]}>
                                <Text style={[tp.valText, { color:theme.text }]}>{pad(hour)}</Text>
                            </View>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor:bg }]} onPress={() => setHour(h => (h-1+24)%24)}>
                                <MaterialCommunityIcons name="chevron-down" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={[tp.unit, { color:theme.textSecondary }]}>horas</Text>
                        </View>
                        <Text style={[tp.colon, { color:theme.text }]}>:</Text>
                        <View style={tp.col}>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor:bg }]} onPress={() => setMin(m => (m+15)%60)}>
                                <MaterialCommunityIcons name="chevron-up" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <View style={[tp.val, { backgroundColor:bg }]}>
                                <Text style={[tp.valText, { color:theme.text }]}>{pad(min)}</Text>
                            </View>
                            <TouchableOpacity style={[tp.arrow, { backgroundColor:bg }]} onPress={() => setMin(m => (m-15+60)%60)}>
                                <MaterialCommunityIcons name="chevron-down" size={30} color={theme.accent} />
                            </TouchableOpacity>
                            <Text style={[tp.unit, { color:theme.textSecondary }]}>minutos</Text>
                        </View>
                    </View>
                    <View style={[tp.preview, { backgroundColor:theme.accent+'18', borderColor:theme.accent+'40' }]}>
                        <Text style={[tp.previewText, { color:theme.accent }]}>{pad(hour)}:{pad(min)}</Text>
                    </View>
                    <View style={tp.btns}>
                        <TouchableOpacity style={[tp.btn, { backgroundColor:bg }]} onPress={onClose}>
                            <Text style={[tp.btnTxt, { color:theme.textSecondary }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[tp.btn, { backgroundColor:theme.accent }]} onPress={onConfirm}>
                            <Text style={[tp.btnTxt, { color:'#000' }]}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const tp = StyleSheet.create({
    overlay:     { flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', alignItems:'center', padding:30 },
    box:         { width:'100%', maxWidth:300, borderRadius:24, borderWidth:1, overflow:'hidden' },
    header:      { flexDirection:'row', alignItems:'center', gap:10, padding:18, borderBottomWidth:1 },
    title:       { fontSize:14, fontWeight:'900', letterSpacing:0.5 },
    row:         { flexDirection:'row', alignItems:'center', justifyContent:'center', padding:20, gap:8 },
    col:         { alignItems:'center', gap:8 },
    arrow:       { width:52, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
    val:         { width:76, height:66, borderRadius:16, alignItems:'center', justifyContent:'center' },
    valText:     { fontSize:34, fontWeight:'900', letterSpacing:-1 },
    unit:        { fontSize:10, fontWeight:'800', opacity:0.5 },
    colon:       { fontSize:34, fontWeight:'900', marginBottom:24 },
    preview:     { alignSelf:'center', paddingHorizontal:22, paddingVertical:9, borderRadius:14, borderWidth:1, marginBottom:16 },
    previewText: { fontSize:20, fontWeight:'900', letterSpacing:2 },
    btns:        { flexDirection:'row', gap:10, padding:16, paddingTop:0 },
    btn:         { flex:1, padding:15, borderRadius:14, alignItems:'center' },
    btnTxt:      { fontSize:13, fontWeight:'900' },
});