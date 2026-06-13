// src/screens/Anamnese/components/TimePicker.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export default function TimePicker({ timeModal, onSelectHour, onSelectMinute, onClose }) {
  if (!timeModal.visible) return null;

  return (
    <Modal visible={timeModal.visible} transparent animationType="fade">
      <View style={t.overlay}>
        <View style={t.box}>
          <Text style={t.title}>
            {timeModal.step === 'hour' ? 'SELECIONE A HORA' : 'SELECIONE OS MINUTOS'}
          </Text>
          <View style={t.grid}>
            {timeModal.step === 'hour'
              ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => (
                  <TouchableOpacity key={h} style={t.opt} onPress={() => onSelectHour(h)}>
                    <Text style={t.optText}>{h}h</Text>
                  </TouchableOpacity>
                ))
              : ['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                  <TouchableOpacity key={m} style={t.opt} onPress={() => onSelectMinute(m)}>
                    <Text style={t.optText}>{m}m</Text>
                  </TouchableOpacity>
                ))
            }
          </View>
          <TouchableOpacity style={t.cancel} onPress={onClose}>
            <Text style={t.cancelText}>CANCELAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const t = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', padding:20 },
  box:        { width:'100%', maxWidth:360, padding:24, borderRadius:24, backgroundColor:'#1C1C1E', borderWidth:1, borderColor:'#3A3A3C' },
  title:      { fontSize:14, fontWeight:'900', letterSpacing:1, textAlign:'center', marginBottom:16, color:'#FFF' },
  grid:       { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center' },
  opt:        { width:'20%', paddingVertical:12, borderRadius:12, borderWidth:1, alignItems:'center', borderColor:'#3A3A3C', backgroundColor:'#2C2C2E' },
  optText:    { fontWeight:'bold', fontSize:15, color:'#FFF' },
  cancel:     { marginTop:20, padding:12, alignItems:'center' },
  cancelText: { color:'#8E8E93', fontWeight:'bold' },
});