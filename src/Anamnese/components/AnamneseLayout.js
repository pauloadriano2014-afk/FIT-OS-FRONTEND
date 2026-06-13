// src/screens/Anamnese/components/AnamneseLayout.js
// Responsável ÚNICO pelo layout: header + scroll + footer
// Isolado aqui para poder ajustar o scroll sem mexer nos steps
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Platform, StatusBar, SafeAreaView, useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AnamneseLayout({
  theme,
  step, totalSteps,
  onBack, onNext, onClose,
  nextLabel = 'PRÓXIMO',
  nextDisabled = false,
  children,
}) {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // 🔥 MÁGICA CONTRA A TELA MOLENGA NO PWA (iOS):
  // Usamos a altura exata da janela (height) em vez de 'position: fixed'.
  // O 'overflow: hidden' no pai impede que a tela toda pule. Apenas o miolo rola.
  if (isWeb) {
    return (
      <View style={{
        height: height,
        width: '100%',
        backgroundColor: theme.isDark ? '#0a0a0a' : '#E5E5EA',
        alignItems: 'center',
        overflow: 'hidden' // Blinda o eixo Y externo
      }}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <View style={{
          width: '100%', maxWidth: 480, flex: 1,
          backgroundColor: theme.bg,
          borderLeftWidth: width > 480 ? 1 : 0, 
          borderRightWidth: width > 480 ? 1 : 0,
          borderColor: theme.border,
          display: 'flex', flexDirection: 'column',
          overflowX: 'hidden' // 🔥 TRAVA: Impede a rolagem horizontal indesejada no container principal
        }}>
          <Header theme={theme} step={step} totalSteps={totalSteps} onClose={onClose} />
          
          {/* O miolo scrollável isolado e blindado contra o efeito elástico */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden', // 🔥 TRAVA: Garante que o scroll aconteça apenas no eixo Y
            WebkitOverflowScrolling: 'touch', 
            overscrollBehavior: 'none',
            width: '100%' // Garante que não ultrapasse a largura do pai
          }}>
            <div style={{ 
              padding: 20, 
              paddingBottom: 32,
              width: '100%', // 🔥 Garante que o conteúdo respeite o limite
              boxSizing: 'border-box' // 🔥 O padding não soma na largura total
            }}>
              {children}
            </div>
          </div>
          
          <Footer theme={theme} step={step} onBack={onBack} onNext={onNext} nextLabel={nextLabel} nextDisabled={nextDisabled} />
        </View>
      </View>
    );
  }

  // Mobile: layout nativo blindado
  return (
    <SafeAreaView style={[l.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} />
      <View style={[l.inner, { backgroundColor: theme.bg }]}>
        <Header theme={theme} step={step} totalSteps={totalSteps} onClose={onClose} />
        <ScrollView
          style={l.scroll}
          contentContainerStyle={l.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false} // 🔥 Desliga o efeito elástico nativo para não bugar o rodapé
        >
          {children}
        </ScrollView>
        <Footer theme={theme} step={step} onBack={onBack} onNext={onNext} nextLabel={nextLabel} nextDisabled={nextDisabled} />
      </View>
    </SafeAreaView>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ theme, step, totalSteps, onClose }) {
  const pct = `${(step / totalSteps) * 100}%`;
  return (
    <View style={[l.header, { backgroundColor: theme.bg }]}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <Text style={[l.title, { color: theme.accent }]}>ANAMNESE</Text>
        {step === 1 && onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={[l.closeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={[l.progressBg, { backgroundColor: theme.border }]}>
        <View style={[l.progressFill, { backgroundColor: theme.accent, width: pct }]} />
      </View>
      <Text style={[l.counter, { color: theme.textSecondary }]}>
        Etapa {step} de {totalSteps}
      </Text>
    </View>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer({ theme, step, onBack, onNext, nextLabel, nextDisabled }) {
  return (
    <View style={[l.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
      {step > 1
        ? (
          <TouchableOpacity
            onPress={onBack}
            style={[l.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <Text style={{ color: theme.text, fontWeight:'bold' }}>VOLTAR</Text>
          </TouchableOpacity>
        )
        : <View style={{ flex:1 }} />
      }
      <TouchableOpacity
        onPress={onNext}
        disabled={nextDisabled}
        style={[l.nextBtn, { backgroundColor: theme.accent, opacity: nextDisabled ? 0.6 : 1 }]}
      >
        <Text style={{ color: theme.isDark ? '#000':'#FFF', fontWeight:'900' }}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const l = StyleSheet.create({
  safe:         { flex:1 },
  inner:        { flex:1 },
  header:       { padding:20, paddingTop: Platform.OS === 'android' ? 20 : 10 },
  title:        { fontSize:20, fontWeight:'900', letterSpacing:1 },
  counter:      { fontSize:11, fontWeight:'bold', marginTop:8, alignSelf:'flex-end' },
  progressBg:   { height:6, marginTop:15, borderRadius:3 },
  progressFill: { height:6, borderRadius:3 },
  closeBtn:     { padding:8, borderRadius:20, borderWidth:1 },
  scroll:       { flex:1 },
  scrollContent:{ padding:20, paddingBottom:40 },
  footer:       { flexDirection:'row', padding:20,
                  paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                  borderTopWidth:1, gap:15 },
  backBtn:      { flex:1, padding:16, alignItems:'center', borderRadius:16, borderWidth:1 },
  nextBtn:      { flex:2, padding:16, alignItems:'center', borderRadius:16, elevation:2 },
});