// src/components/Training/PersonalRecordsCard.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PersonalRecordsCard({ theme, logs }) {
  // ─── LÓGICA DE ELITE: CÁLCULO DOS RECORDES (PRs) ────────────────────────
  const records = useMemo(() => {
    if (!logs || logs.length === 0) return null;

    let maxDist = 0;
    let maxTime = 0;
    let bestPaceSecs = Infinity;
    let bestPaceStr = '--:--';

    // Helper: converte "MM:SS" para segundos
    const parsePace = (paceStr) => {
      if (!paceStr) return Infinity;
      const parts = paceStr.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return Infinity;
    };

    logs.forEach(log => {
      const dist = parseFloat(log.distanceKm) || 0;
      const time = parseInt(log.durationMinutes) || 0;
      const paceSecs = parsePace(log.avgPace);

      if (dist > maxDist) maxDist = dist;
      if (time > maxTime) maxTime = time;
      if (paceSecs < bestPaceSecs) {
        bestPaceSecs = paceSecs;
        bestPaceStr = log.avgPace;
      }
    });

    return { 
      maxDist: maxDist.toFixed(2), 
      maxTime, 
      bestPaceSecs, 
      bestPaceStr 
    };
  }, [logs]);

  // ─── LÓGICA DE ELITE: FÓRMULA DE RIEGEL PARA PROJEÇÃO ───────────────────
  const predictions = useMemo(() => {
    // 🔥 A BLINDAGEM ESTÁ AQUI: Se não tiver pace, retorna tracinhos ao invés de quebrar
    const emptyPred = { fiveK: '--', tenK: '--', halfMarathon: '--', marathon: '--' };
    
    if (!records || records.bestPaceSecs === Infinity) return emptyPred;

    // Constrói um tempo base (Tempo de um 5K com o melhor pace do aluno)
    const baseDistance = 5; 
    const baseTimeSecs = records.bestPaceSecs * baseDistance;

    // Fórmula de Riegel: T2 = T1 * (D2 / D1)^1.06
    const predict = (targetDist) => {
      const predictedSecs = baseTimeSecs * Math.pow((targetDist / baseDistance), 1.06);
      
      const h = Math.floor(predictedSecs / 3600);
      const m = Math.floor((predictedSecs % 3600) / 60);
      const s = Math.round(predictedSecs % 60);
      
      const pad = (num) => num.toString().padStart(2, '0');
      if (h > 0) return `${h}h ${pad(m)}m`;
      return `${m}m ${pad(s)}s`;
    };

    return {
      fiveK: predict(5),
      tenK: predict(10),
      halfMarathon: predict(21.1),
      marathon: predict(42.2)
    };
  }, [records]);

  if (!records) {
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="medal-outline" size={32} color={theme.textSecondary} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Sem Recordes Ainda</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Complete seu primeiro treino para destravar seus PRs e projeções de prova.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      
      {/* SEÇÃO 1: RECORDES PESSOAIS (PRs) */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
          <MaterialCommunityIcons name="trophy-variant" size={18} color="#f59e0b" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>SEUS RECORDES (PR)</Text>
      </View>

      <View style={styles.prRow}>
        <View style={styles.prBox}>
          <Text style={[styles.prLabel, { color: theme.textSecondary }]}>MAIOR DIST.</Text>
          <Text style={[styles.prValue, { color: '#f59e0b' }]}>{records.maxDist}<Text style={styles.prUnit}> km</Text></Text>
        </View>
        
        <View style={[styles.prDivider, { backgroundColor: theme.border }]} />
        
        <View style={styles.prBox}>
          <Text style={[styles.prLabel, { color: theme.textSecondary }]}>MELHOR PACE</Text>
          <Text style={[styles.prValue, { color: '#f59e0b' }]}>{records.bestPaceStr}<Text style={styles.prUnit}> /km</Text></Text>
        </View>

        <View style={[styles.prDivider, { backgroundColor: theme.border }]} />

        <View style={styles.prBox}>
          <Text style={[styles.prLabel, { color: theme.textSecondary }]}>MAIS LONGO</Text>
          <Text style={[styles.prValue, { color: '#f59e0b' }]}>{records.maxTime}<Text style={styles.prUnit}> min</Text></Text>
        </View>
      </View>

      {/* SEÇÃO 2: PREVISOR DE TEMPOS */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
      
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: '#3b82f622' }]}>
          <MaterialCommunityIcons name="radar" size={18} color="#3b82f6" />
        </View>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>PREVISOR DE PROVAS</Text>
          <Text style={[styles.subTitle, { color: theme.textSecondary }]}>Baseado no seu melhor Pace</Text>
        </View>
      </View>

      <View style={styles.predictionsGrid}>
        <View style={[styles.predBox, { backgroundColor: theme.bg }]}>
          <Text style={[styles.predLabel, { color: theme.text }]}>10K</Text>
          <Text style={[styles.predValue, { color: '#3b82f6' }]}>{predictions.tenK}</Text>
        </View>
        <View style={[styles.predBox, { backgroundColor: theme.bg }]}>
          <Text style={[styles.predLabel, { color: theme.text }]}>MEIA (21K)</Text>
          <Text style={[styles.predValue, { color: '#3b82f6' }]}>{predictions.halfMarathon}</Text>
        </View>
        <View style={[styles.predBox, { backgroundColor: theme.bg }]}>
          <Text style={[styles.predLabel, { color: theme.text }]}>MARATONA</Text>
          <Text style={[styles.predValue, { color: '#3b82f6' }]}>{predictions.marathon}</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20, borderRadius: 24, borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  subTitle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  prRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  prBox: { flex: 1, alignItems: 'center' },
  prLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  prValue: { fontSize: 22, fontWeight: '900' },
  prUnit: { fontSize: 12, fontWeight: '700', color: '#888' },
  prDivider: { width: 1, height: 30, opacity: 0.5 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  predictionsGrid: { flexDirection: 'row', gap: 10 },
  predBox: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  predLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 4 },
  predValue: { fontSize: 14, fontWeight: '900' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginTop: 12, marginBottom: 4 },
  emptyDesc: { fontSize: 12, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }
});