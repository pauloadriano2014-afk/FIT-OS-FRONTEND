// src/components/ExerciseCardParts/HowToExecuteModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Normaliza valores de gênero que podem vir de fontes diferentes do app
// (anamnese, cadastro, etc) para só duas chaves: 'MALE' ou 'FEMALE'.
// Qualquer outro valor (vazio, "OUTRO", etc) cai em null e o modal não
// mostra nenhuma seção de foco — só o texto base de howToExecute.
const normalizeGender = (raw) => {
  if (!raw) return null;
  const g = String(raw).trim().toUpperCase();
  if (['MASCULINO', 'MALE', 'M', 'HOMEM'].includes(g)) return 'MALE';
  if (['FEMININO', 'FEMALE', 'F', 'MULHER'].includes(g)) return 'FEMALE';
  return null;
};

// Modal de texto estruturado "Como Executar" / "Erros Comuns" de um exercício,
// com uma seção extra de foco direcionado por gênero (maleFocus/femaleFocus),
// mostrada condicionalmente conforme o gênero do aluno logado. Quando o gênero
// não está definido ou não bate com MALE/FEMALE, o modal mostra só o texto
// base (howToExecute + commonMistakes), sem quebrar nem mostrar nada estranho.
export default function HowToExecuteModal({ visible, onClose, colors, exerciseTitle, howToExecute, commonMistakes, maleFocus, femaleFocus, studentGender }) {
  const normalizedGender = normalizeGender(studentGender);
  const focusText = normalizedGender === 'MALE' ? maleFocus : normalizedGender === 'FEMALE' ? femaleFocus : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
            <View style={styles.header}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={26} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>{exerciseTitle}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {!!howToExecute && (
              <View style={{ marginBottom: 20 }}>
                <View style={styles.sectionLabelRow}>
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionLabel, { color: colors.primary }]}>COMO EXECUTAR</Text>
                </View>
                <Text style={[styles.bodyText, { color: colors.text }]}>{howToExecute}</Text>
              </View>
            )}

            {!!focusText && (
              <View style={{ marginBottom: 20 }}>
                <View style={styles.sectionLabelRow}>
                  <MaterialCommunityIcons name="star-outline" size={16} color={colors.primary} />
                  <Text style={[styles.sectionLabel, { color: colors.primary }]}>POR QUE ESSE EXERCÍCIO É IMPORTANTE PRA VOCÊ</Text>
                </View>
                <Text style={[styles.bodyText, { color: colors.text }]}>{focusText}</Text>
              </View>
            )}

            {!!commonMistakes && (
              <View>
                <View style={styles.sectionLabelRow}>
                  <MaterialCommunityIcons name="alert-outline" size={16} color="#FF9500" />
                  <Text style={[styles.sectionLabel, { color: '#FF9500' }]}>ERROS COMUNS</Text>
                </View>
                <Text style={[styles.bodyText, { color: colors.text }]}>{commonMistakes}</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.primaryText }]}>ENTENDI</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20, zIndex: 1000 },
  contentCard: { width: '100%', maxWidth: 440, alignSelf: 'center', padding: 25, borderRadius: 25, borderWidth: 1, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '900', flex: 1, flexWrap: 'wrap' },
  divider: { height: 1, width: '100%', marginBottom: 15 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  closeBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeBtnText: { fontWeight: '900', fontSize: 14 },
});