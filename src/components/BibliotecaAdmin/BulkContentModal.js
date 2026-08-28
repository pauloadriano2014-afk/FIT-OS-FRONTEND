// src/components/BibliotecaAdmin/BulkContentModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authHeaders } from '../../utils/authToken';

// Modal para colar um JSON com conteúdo de execução (howToExecute,
// commonMistakes, maleFocus, femaleFocus) gerado fora do app — ex: pedido
// ao Claude — e aplicar em lote, por NOME de exercício, em todos os coaches
// que tiverem aquele nome cadastrado. Pensado para ser reutilizável sempre
// que novos exercícios forem cadastrados, sem precisar editar código.
export default function BulkContentModal({ visible, onClose, theme }) {
  const isWeb = Platform.OS === 'web';
  const [jsonText, setJsonText] = useState('');
  const [applying, setApplying] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [parseError, setParseError] = useState(null);

  const handleClose = () => {
    setJsonText('');
    setResultSummary(null);
    setParseError(null);
    onClose();
  };

  const handleApply = async () => {
    setParseError(null);
    setResultSummary(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      setParseError("JSON inválido. Confira se copiou o conteúdo completo, com chaves e colchetes corretos.");
      return;
    }

    // Aceita tanto { "items": [...] } quanto um array solto [...] — facilita
    // colar exatamente o que for gerado, sem se preocupar com o wrapper.
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(items) || items.length === 0) {
      setParseError('O JSON precisa ter uma lista de itens (formato [...] ou { "items": [...] }).');
      return;
    }

    setApplying(true);
    try {
      const res = await fetch('https://fitos-final.onrender.com/api/admin/bulk-update-exercise-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultSummary(data);
      } else {
        setParseError(data.error || "Erro ao aplicar o conteúdo.");
      }
    } catch (e) {
      setParseError("Erro de conexão. Tente novamente.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: isWeb ? 'rgba(0,0,0,0.85)' : theme.bg, justifyContent: 'center' }}>
        <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: isWeb ? 700 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? { borderRadius: 24, marginVertical: '4%', maxHeight: '92vh', overflow: 'hidden', borderWidth: 1, borderColor: theme.border } : {}) }}>

          <View style={[S.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: theme.textSecondary, letterSpacing: 1 }}>BIBLIOTECA</Text>
              <Text style={[S.title, { color: theme.text }]}>APLICAR CONTEÚDO EM LOTE</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={[S.closeBtn, { backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1 }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 25, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 18, marginBottom: 16 }}>
              Cole aqui o JSON com o conteúdo de execução dos exercícios (gerado externamente). A aplicação é feita por NOME — se o mesmo exercício existir em mais de um coach (ex: você e a Adri), o conteúdo é aplicado nos dois automaticamente.
            </Text>

            <Text style={[S.label, { color: theme.textSecondary }]}>JSON DE CONTEÚDO</Text>
            <TextInput
              style={[S.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder='[{"name": "Agachamento Livre", "howToExecute": "...", "commonMistakes": "...", "maleFocus": "...", "femaleFocus": "..."}]'
              placeholderTextColor={theme.textSecondary}
              value={jsonText}
              onChangeText={setJsonText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!!parseError && (
              <View style={[S.alertBox, { backgroundColor: '#FF3B3015', borderColor: '#FF3B3040' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF3B30" />
                <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '700', flex: 1 }}>{parseError}</Text>
              </View>
            )}

            {!!resultSummary && (
              <View style={[S.resultBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#34C759" />
                  <Text style={{ color: theme.text, fontWeight: '900', fontSize: 13 }}>APLICADO COM SUCESSO</Text>
                </View>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 4 }}>
                  {resultSummary.totalUpdated} registro(s) de exercício atualizados, a partir de {resultSummary.totalItems} item(ns) enviados.
                </Text>
                {resultSummary.notFoundCount > 0 && (
                  <Text style={{ color: '#FF9500', fontSize: 12, marginTop: 8, fontWeight: '700' }}>
                    ⚠️ {resultSummary.notFoundCount} nome(s) não encontrados na biblioteca (confira grafia/acentos):
                  </Text>
                )}
                {resultSummary.notFoundCount > 0 && (
                  <View style={{ marginTop: 6 }}>
                    {resultSummary.results.filter(r => r.updated === 0).map((r, idx) => (
                      <Text key={idx} style={{ color: theme.textSecondary, fontSize: 11, marginBottom: 2 }}>
                        • {r.name} {r.error ? `(${r.error})` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          <View style={[S.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
            <TouchableOpacity
              style={[S.applyBtn, { backgroundColor: applying || !jsonText.trim() ? theme.border : theme.accent }]}
              onPress={handleApply}
              disabled={applying || !jsonText.trim()}
            >
              {applying ? <ActivityIndicator color={theme.isDark ? '#000' : '#FFF'} /> : <Text style={[S.applyBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>APLICAR EM LOTE</Text>}
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const S = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 25, alignItems: 'center', borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  textArea: { minHeight: 280, borderRadius: 16, padding: 16, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', borderWidth: 1, textAlignVertical: 'top', outlineStyle: 'none' },
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  resultBox: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 16 },
  footer: { padding: 20, borderTopWidth: 1 },
  applyBtn: { padding: 18, borderRadius: 16, alignItems: 'center' },
  applyBtnText: { fontWeight: '900', fontSize: 14, letterSpacing: 0.5 },
});