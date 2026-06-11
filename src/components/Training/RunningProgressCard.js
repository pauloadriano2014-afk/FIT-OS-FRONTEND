// src/components/Training/RunningProgressCard.js
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RunningProgressCard({ theme, logs }) {
  // 'calendar' | 'charts'
  const [activeTab, setActiveTab] = useState('calendar');
  // 'distance' | 'duration' | 'pace'
  const [chartType, setChartType] = useState('distance');

  // ─── LÓGICA DO CALENDÁRIO MENSAL ──────────────────────────────────────────
  const calendarData = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const todayDate = now.getDate();

    const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const monthName = monthNames[m];

    const firstDayOfWeek = new Date(y, m, 1).getDay(); 
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const runDates = {};
    let totalKm = 0;
    let totalRuns = 0;

    (logs || []).forEach(log => {
      if (!log.date) return;
      const logDate = new Date(log.date);
      if (logDate.getFullYear() === y && logDate.getMonth() === m) {
        const dayStr = logDate.getDate();
        runDates[dayStr] = true;
        totalKm += parseFloat(log.distanceKm) || 0;
        totalRuns++;
      }
    });

    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) daysArray.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      daysArray.push({ day: d, hasRun: !!runDates[d], isToday: d === todayDate });
    }

    return { daysArray, totalKm: totalKm.toFixed(1), totalRuns, monthName, todayDate };
  }, [logs]);

  // ─── LÓGICA DOS GRÁFICOS (ÚLTIMAS 4 SEMANAS) ──────────────────────────────
  const chartData = useMemo(() => {
    const weeksMap = {};

    const getMonday = (d) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(date.setDate(diff)).setHours(0,0,0,0);
    };

    (logs || []).forEach(log => {
      if (!log.date) return;
      const mondayTs = getMonday(log.date);
      
      if (!weeksMap[mondayTs]) {
        const md = new Date(mondayTs);
        const label = `${String(md.getDate()).padStart(2, '0')}/${String(md.getMonth() + 1).padStart(2, '0')}`;
        weeksMap[mondayTs] = { ts: mondayTs, label, dist: 0, dur: 0, paceSecs: 0, paceCount: 0 };
      }
      
      weeksMap[mondayTs].dist += parseFloat(log.distanceKm) || 0;
      weeksMap[mondayTs].dur += parseInt(log.durationMinutes) || 0;
      
      if (log.avgPace) {
        const parts = log.avgPace.split(':').map(Number);
        if (parts.length === 2) {
          weeksMap[mondayTs].paceSecs += (parts[0] * 60 + parts[1]);
          weeksMap[mondayTs].paceCount += 1;
        }
      }
    });

    const sortedWeeks = Object.values(weeksMap).sort((a, b) => a.ts - b.ts);
    const last4 = sortedWeeks.slice(-4);

    // Formata o pace para mm:ss
    const formatPace = (secs) => {
      if (!secs) return '0:00';
      const m = Math.floor(secs / 60);
      const s = Math.round(secs % 60);
      return `${m}:${String(s).padStart(2, '0')}`;
    };

    return last4.map(w => ({
      label: w.label,
      distance: w.dist,
      duration: w.dur,
      avgPaceSecs: w.paceCount > 0 ? (w.paceSecs / w.paceCount) : 0,
      avgPaceStr: w.paceCount > 0 ? formatPace(w.paceSecs / w.paceCount) : '0:00'
    }));
  }, [logs]);

  // ─── RENDERIZADORES ───────────────────────────────────────────────────────
  const renderCalendar = () => (
    <View style={styles.contentArea}>
      <View style={styles.calendarStatsRow}>
        <View style={styles.calStatBox}>
          <Text style={[styles.calStatVal, { color: '#22c55e' }]}>{calendarData.totalRuns}</Text>
          <Text style={[styles.calStatLabel, { color: theme.textSecondary }]}>CORRIDAS</Text>
        </View>
        <View style={[styles.calStatDiv, { backgroundColor: theme.border }]} />
        <View style={styles.calStatBox}>
          <Text style={[styles.calStatVal, { color: '#22c55e' }]}>{calendarData.totalKm} <Text style={{fontSize: 12}}>km</Text></Text>
          <Text style={[styles.calStatLabel, { color: theme.textSecondary }]}>VOLUME MENSAL</Text>
        </View>
      </View>

      <View style={styles.weekDaysRow}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, i) => (
          <Text key={i} style={[styles.weekDayText, { color: theme.textSecondary }]}>{wd}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarData.daysArray.map((item, index) => {
          if (item === null) return <View key={`empty-${index}`} style={styles.dayCell} />;
          const isFuture = item.day > calendarData.todayDate;

          return (
            <View key={`day-${item.day}`} style={styles.dayCell}>
              <View style={[
                styles.dayCircle, 
                item.hasRun && { backgroundColor: '#22c55e' },
                !item.hasRun && item.isToday && { borderColor: '#22c55e', borderWidth: 1 },
                !item.hasRun && !item.isToday && !isFuture && { backgroundColor: theme.bg, opacity: 0.5 }
              ]}>
                {item.hasRun ? (
                  <MaterialCommunityIcons name="check" size={12} color="#000" />
                ) : (
                  <Text style={[styles.dayText, { color: item.isToday ? '#22c55e' : theme.textSecondary }, isFuture && { opacity: 0.2 }]}>
                    {item.day}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderCharts = () => {
    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <MaterialCommunityIcons name="chart-bar" size={32} color={theme.border} />
          <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>Nenhum dado nas últimas semanas.</Text>
        </View>
      );
    }

    let maxVal = 1;
    if (chartType === 'distance') maxVal = Math.max(...chartData.map(d => d.distance), 5);
    if (chartType === 'duration') maxVal = Math.max(...chartData.map(d => d.duration), 30);
    if (chartType === 'pace') maxVal = Math.max(...chartData.map(d => d.avgPaceSecs), 300);

    const getBarColor = () => {
      if (chartType === 'distance') return '#22c55e';
      if (chartType === 'duration') return '#3b82f6';
      return '#f59e0b';
    };

    return (
      <View style={styles.contentArea}>
        <View style={styles.chartPillsRow}>
          <TouchableOpacity style={[styles.chartPill, chartType === 'distance' && { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]} onPress={() => setChartType('distance')}>
            <Text style={[styles.chartPillText, { color: chartType === 'distance' ? '#22c55e' : theme.textSecondary }]}>KM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chartPill, chartType === 'duration' && { backgroundColor: '#3b82f622', borderColor: '#3b82f6' }]} onPress={() => setChartType('duration')}>
            <Text style={[styles.chartPillText, { color: chartType === 'duration' ? '#3b82f6' : theme.textSecondary }]}>TEMPO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chartPill, chartType === 'pace' && { backgroundColor: '#f59e0b22', borderColor: '#f59e0b' }]} onPress={() => setChartType('pace')}>
            <Text style={[styles.chartPillText, { color: chartType === 'pace' ? '#f59e0b' : theme.textSecondary }]}>PACE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          {chartData.map((data, idx) => {
            const val = chartType === 'distance' ? data.distance : chartType === 'duration' ? data.duration : data.avgPaceSecs;
            const displayStr = chartType === 'distance' ? data.distance.toFixed(1) : chartType === 'duration' ? `${data.duration}m` : data.avgPaceStr;
            const heightPct = (val / maxVal) * 100;

            return (
              <View key={idx} style={styles.barCol}>
                <Text style={[styles.barValue, { color: theme.text }]}>{val > 0 ? displayStr : ''}</Text>
                <View style={[styles.barTrack, { backgroundColor: theme.bg }]}>
                  <View style={[styles.barFill, { height: `${heightPct}%`, backgroundColor: getBarColor() }]} />
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{data.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      
      {/* TABS SUPERIORES DO CARD */}
      <View style={[styles.tabsHeader, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.mainTab, activeTab === 'calendar' && { borderBottomColor: '#22c55e' }]} onPress={() => setActiveTab('calendar')}>
          <MaterialCommunityIcons name="calendar-month" size={16} color={activeTab === 'calendar' ? '#22c55e' : theme.textSecondary} />
          <Text style={[styles.mainTabText, { color: activeTab === 'calendar' ? '#22c55e' : theme.textSecondary }]}>{calendarData.monthName}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainTab, activeTab === 'charts' && { borderBottomColor: '#3b82f6' }]} onPress={() => setActiveTab('charts')}>
          <MaterialCommunityIcons name="chart-bar" size={16} color={activeTab === 'charts' ? '#3b82f6' : theme.textSecondary} />
          <Text style={[styles.mainTabText, { color: activeTab === 'charts' ? '#3b82f6' : theme.textSecondary }]}>ESTATÍSTICAS</Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DINÂMICO */}
      {activeTab === 'calendar' ? renderCalendar() : renderCharts()}

    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  
  tabsHeader: { flexDirection: 'row', borderBottomWidth: 1 },
  mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainTabText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  contentArea: { padding: 20 },

  // Calendário
  calendarStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  calStatBox: { flex: 1, alignItems: 'center' },
  calStatVal: { fontSize: 22, fontWeight: '900' },
  calStatLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  calStatDiv: { width: 1, height: 30, opacity: 0.5 },
  
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekDayText: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dayCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 11, fontWeight: '700' },

  // Gráficos
  chartPillsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  chartPill: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
  chartPillText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, fontWeight: '900', marginBottom: 6, opacity: 0.8 },
  barTrack: { width: 32, height: 100, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 9, fontWeight: '800', marginTop: 10, textTransform: 'uppercase' },

  emptyChart: { padding: 40, alignItems: 'center' },
  emptyChartText: { fontSize: 12, fontWeight: '600', marginTop: 10 }
});