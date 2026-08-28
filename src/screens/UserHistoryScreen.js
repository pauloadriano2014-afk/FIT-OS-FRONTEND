import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, 
  ActivityIndicator, Platform, StatusBar, Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

export default function UserHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  // 🔥 PUXA AS CORES DO CONTEXTO
  const { theme: colors } = useTheme();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      
      const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`, { headers: { ...(await authHeaders()) } });
      const data = await res.json();
      
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = colors.isDark ? '#0a0a0a' : '#E5E5EA';

  // 🔥 ESTRUTURA DE RAIZ IGUAL AO DAYWORKOUT PARA MATAR O BUG DO SCROLL
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg, overflow: 'hidden' }
    : { flex: 1, backgroundColor: colors.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      
      {/* HEADER: Centralizado no PC e Full no Mobile */}
      <View style={{ width: '100%', alignItems: 'center', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: '100%', maxWidth: isWeb ? 480 : '100%', flexDirection: 'row', alignItems: 'center', padding: 20, justifyContent:'space-between' }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>HISTÓRICO DE TREINOS</Text>
              <View style={{ width: 40 }} />
          </View>
      </View>

      {/* ÁREA DE SCROLL: O segredo está no flexGrow e na View interna */}
      <View style={{ flex: 1 }}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}
            showsVerticalScrollIndicator={isWeb} // Mostra barra no PC
            bounces={false}
            overScrollMode="never"
          >
              <View style={{ 
                  width: '100%', 
                  maxWidth: isWeb ? 480 : '100%', 
                  minHeight: isWeb ? '100%' : 'auto', // Força o preenchimento para o scroll ativar
                  backgroundColor: colors.bg, 
                  padding: 20,
                  paddingBottom: 150,
                  ...(isWeb ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border } : {})
              }}>
                  
                  {loading ? (
                      <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 50 }} />
                  ) : history.length === 0 ? (
                      <View style={{ alignItems: 'center', marginTop: 50 }}>
                          <MaterialCommunityIcons name="history" size={50} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Nenhum treino finalizado ainda.</Text>
                      </View>
                  ) : (
                      history.map((item) => {
                          const isExpanded = expandedId === item.id;
                          return (
                              <TouchableOpacity 
                                  key={item.id}
                                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                                  onPress={() => toggleExpand(item.id)} 
                                  activeOpacity={0.9}
                              >
                                  <View style={styles.cardHeader}>
                                      <View style={styles.titleContainer}>
                                          <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
                                          <Text style={[styles.date, { color: colors.textSecondary }]}>
                                              {new Date(item.date).toLocaleDateString('pt-BR')} • {item.duration || 60} min
                                          </Text>
                                      </View>
                                      <View style={[styles.xpBadge, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '55' }]}>
                                          <Text style={[styles.xpText, { color: colors.accent }]}>+{item.xpEarned} XP</Text>
                                      </View>
                                  </View>

                                  <View style={styles.metaRow}>
                                      {item.rpe && (
                                          <View style={styles.metaItem}>
                                              <MaterialCommunityIcons name="speedometer" size={14} color={colors.accent} />
                                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Esforço: {item.rpe}/10</Text>
                                          </View>
                                      )}
                                      {item.feedback ? (
                                          <View style={styles.metaItem}>
                                              <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.textSecondary} />
                                              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Ver obs...</Text>
                                          </View>
                                      ) : null}
                                  </View>

                                  {isExpanded && (
                                      <View style={styles.detailsContainer}>
                                          <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                          {item.feedback ? (
                                              <View style={{ marginBottom: 15 }}>
                                                  <Text style={{ color: colors.textSecondary, fontSize: 10, marginBottom: 2 }}>OBSERVAÇÃO:</Text>
                                                  <Text style={[styles.fullFeedback, { color: colors.text }]}>"{item.feedback}"</Text>
                                              </View>
                                          ) : null}
                                          
                                          <Text style={[styles.detailsTitle, { color: colors.accent }]}>CARGAS UTILIZADAS:</Text>
                                          {item.details && Array.isArray(item.details) ? item.details.map((ex, idx) => (
                                              <View key={idx} style={styles.exRow}>
                                                  <Text style={[styles.exName, { color: colors.text }]}>{ex.exerciseName || ex.name}</Text>
                                                  <Text style={[styles.exLoad, { color: colors.textSecondary }]}>{ex.weight}kg ({ex.reps} reps)</Text>
                                              </View>
                                          )) : (
                                              <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' }}>Sem detalhes registrados.</Text>
                                          )}
                                      </View>
                                  )}
                              </TouchableOpacity>
                          );
                      })
                  )}
              </View>
          </ScrollView>
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleContainer: { flex: 1, marginRight: 10 }, 
  title: { fontSize: 16, fontWeight: 'bold' }, 
  date: { fontSize: 12, marginTop: 4 },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, minWidth: 70, alignItems: 'center' },
  xpText: { fontWeight: 'bold', fontSize: 12 },
  metaRow: { flexDirection: 'row', gap: 15, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12 },
  detailsContainer: { marginTop: 5 },
  divider: { height: 1, marginVertical: 10 },
  fullFeedback: { fontStyle: 'italic', fontSize: 13 },
  detailsTitle: { fontSize: 10, fontWeight: 'bold', marginBottom: 8 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  exName: { fontSize: 12, flex: 1, marginRight: 10 },
  exLoad: { fontSize: 12, fontWeight: 'bold' }
});