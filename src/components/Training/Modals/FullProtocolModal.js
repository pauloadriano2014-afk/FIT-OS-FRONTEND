// src/components/Training/Modals/FullProtocolModal.js
import React from 'react';
import { View, Text, ScrollView, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PROTOCOL_DATA } from '../../../utils/runningConstants';

export default function FullProtocolModal({ visible, onClose, theme }) {
  const ZONES = [
    { zone: 'Z2 – Leve', feeling: 'Respiração estável, dá pra conversar', esteira: '7.5–7.8 km/h', rua: '7:45–8:20 /km' },
    { zone: 'Z3 – Moderado', feeling: 'Respiração acelerada, frases curtas', esteira: '8.0–8.5 km/h', rua: '7:00–7:30 /km' },
    { zone: 'Z4 – Forte', feeling: 'Difícil falar, respiração pesada', esteira: '9.0–10.0 km/h', rua: '6:00–6:40 /km' },
    { zone: 'Z5 – Tiros', feeling: 'Máxima intensidade, não fala', esteira: '10.5–11.5 km/h', rua: '5:20–6:00 /km' },
  ];
  const TIPS = [
    { cat: 'Técnica', tip: 'Mantenha a passada curta — reduz impacto e protege o joelho.' },
    { cat: 'Técnica', tip: 'Ombros relaxados e tronco levemente inclinado.' },
    { cat: 'Respiração', tip: 'Use nariz + boca. Ritmo 2:2 (2 passos inspira / 2 expira).' },
    { cat: 'Ritmo', tip: 'Se cansar: diminua a velocidade, não pare.' },
    { cat: 'Ritmo', tip: 'Comece devagar e aumente aos poucos.' },
    { cat: 'Hidratação', tip: 'Hidrate ao longo do dia, não apenas antes do treino.' },
    { cat: 'Mentalidade', tip: '"É você contra você." A disciplina vence a motivação.' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[modalStyles.header, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[modalStyles.iconBox, { backgroundColor: '#22c55e22' }]}>
                <MaterialCommunityIcons name="book-open-outline" size={20} color="#22c55e" />
              </View>
              <Text style={[modalStyles.headerTitle, { color: theme.text }]}>PROTOCOLO 5K COMPLETO</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <MaterialCommunityIcons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            <Text style={[fullStyles.sectionTitle, { color: theme.text }]}>COMO FUNCIONA</Text>
            <View style={[fullStyles.infoCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Text style={[fullStyles.infoText, { color: theme.textSecondary }]}>
                Você treina <Text style={{ color: '#22c55e', fontWeight: '900' }}>3x por semana</Text> por 8 semanas:{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Quarta</Text> — corrida leve / técnica{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Sexta</Text> — intervalados{'\n'}
                • <Text style={{ fontWeight: 'bold', color: theme.text }}>Domingo</Text> — resistência / performance
              </Text>
            </View>
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>ZONAS DE ESFORÇO</Text>
            {ZONES.map((z, idx) => (
              <View key={idx} style={[fullStyles.zoneRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <Text style={[fullStyles.zoneLabel, { color: '#22c55e' }]}>{z.zone}</Text>
                <Text style={[fullStyles.zoneFeeling, { color: theme.textSecondary }]}>{z.feeling}</Text>
                <View style={fullStyles.zoneSpeeds}>
                  <Text style={[fullStyles.zoneSpeed, { color: theme.text }]}>🏋️ {z.esteira}</Text>
                  <Text style={[fullStyles.zoneSpeed, { color: theme.text }]}>🏃 {z.rua}</Text>
                </View>
              </View>
            ))}
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>OS 5 BLOCOS</Text>
            {Object.entries(PROTOCOL_DATA).map(([block, data]) => (
              <View key={block} style={[fullStyles.blockRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <View style={[fullStyles.blockBadge, { backgroundColor: '#22c55e22' }]}>
                  <Text style={[fullStyles.blockBadgeText, { color: '#22c55e' }]}>B{block}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[fullStyles.blockLabel, { color: theme.text }]}>{data.label}</Text>
                  <Text style={[fullStyles.blockWeeks, { color: theme.textSecondary }]}>Semanas {data.weeks}</Text>
                  <Text style={[fullStyles.blockObj, { color: theme.textSecondary }]}>{data.objective}</Text>
                </View>
              </View>
            ))}
            <Text style={[fullStyles.sectionTitle, { color: theme.text, marginTop: 20 }]}>DICAS IMPORTANTES</Text>
            {TIPS.map((t, idx) => (
              <View key={idx} style={[fullStyles.tipRow, { borderBottomColor: theme.border }]}>
                <View style={[fullStyles.tipCatBadge, { backgroundColor: '#22c55e22' }]}>
                  <Text style={[fullStyles.tipCat, { color: '#22c55e' }]}>{t.cat}</Text>
                </View>
                <Text style={[fullStyles.tipText, { color: theme.textSecondary }]}>{t.tip}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

const fullStyles = StyleSheet.create({
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  infoCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 4 },
  infoText: { fontSize: 13, lineHeight: 22 },
  zoneRow: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  zoneLabel: { fontSize: 13, fontWeight: '900', marginBottom: 4 },
  zoneFeeling: { fontSize: 12, marginBottom: 6 },
  zoneSpeeds: { flexDirection: 'row', gap: 16 },
  zoneSpeed: { fontSize: 12, fontWeight: '700' },
  blockRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  blockBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  blockBadgeText: { fontSize: 13, fontWeight: '900' },
  blockLabel: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  blockWeeks: { fontSize: 11, marginBottom: 4 },
  blockObj: { fontSize: 12, lineHeight: 18 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  tipCatBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  tipCat: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});