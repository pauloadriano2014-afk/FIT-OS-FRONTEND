import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UserHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const user = JSON.parse(storedUser);
      
      // Busca o histórico real
      const res = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
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

  const renderItem = ({ item }) => {
      const isExpanded = expandedId === item.id;
      
      return (
        <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
                {/* Contêiner de Texto Flexível */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.date}>{new Date(item.date).toLocaleDateString('pt-BR')} • {item.duration || 60} min</Text>
                </View>
                
                {/* Badge de XP com tamanho fixo e margem */}
                <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{item.xpEarned} XP</Text>
                </View>
            </View>

            {/* RPE E FEEDBACK RESUMIDO */}
            <View style={styles.metaRow}>
                {item.rpe && (
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="speedometer" size={14} color="#CCFF00" />
                        <Text style={styles.metaText}>Esforço: {item.rpe}/10</Text>
                    </View>
                )}
                {item.feedback && (
                    <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="comment-text-outline" size={14} color="#888" />
                        <Text style={styles.metaText}>Ver obs...</Text>
                    </View>
                )}
            </View>

            {/* DETALHES DOS EXERCÍCIOS (EXPANDIDO) */}
            {isExpanded && (
                <View style={styles.detailsContainer}>
                    <View style={styles.divider} />
                    {item.feedback && (
                        <View style={{marginBottom:15}}>
                            <Text style={{color:'#888', fontSize:10, marginBottom:2}}>OBSERVAÇÃO:</Text>
                            <Text style={styles.fullFeedback}>"{item.feedback}"</Text>
                        </View>
                    )}
                    <Text style={styles.detailsTitle}>CARGAS UTILIZADAS:</Text>
                    {item.details.map((ex, idx) => (
                        <View key={idx} style={styles.exRow}>
                            <Text style={styles.exName}>{ex.exerciseName}</Text>
                            <Text style={styles.exLoad}>{ex.weight}kg ({ex.reps} reps)</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
      );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>HISTÓRICO DE TREINOS</Text>
        <View style={{width:24}}/>
      </View>

      {loading ? (
          <ActivityIndicator size="large" color="#CCFF00" style={{marginTop:50}} />
      ) : (
          <FlatList 
            data={history}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{padding: 20}}
            ListEmptyComponent={
                <View style={{alignItems:'center', marginTop:50}}>
                    <MaterialCommunityIcons name="history" size={50} color="#333" />
                    <Text style={{color:'#666', marginTop:10}}>Nenhum treino finalizado ainda.</Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  navHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:20, paddingBottom:10 },
  navTitle: { color:'#FFF', fontSize:16, fontWeight:'bold' },
  
  card: { backgroundColor:'#111', borderRadius:12, padding:15, marginBottom:15, borderWidth:1, borderColor:'#222' },
  
  // CORREÇÃO DO LAYOUT DO HEADER DO CARD
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' },
  titleContainer: { flex: 1, marginRight: 10 }, // Ocupa o espaço que der, mas deixa margem pro XP
  
  title: { color:'#FFF', fontSize:16, fontWeight:'bold', flexWrap:'wrap' }, // Quebra linha se precisar
  date: { color:'#666', fontSize:12, marginTop:4 },
  
  xpBadge: { backgroundColor:'rgba(204, 255, 0, 0.1)', paddingHorizontal:10, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:'rgba(204, 255, 0, 0.3)', minWidth: 70, alignItems:'center' },
  xpText: { color:'#CCFF00', fontWeight:'bold', fontSize:12 },

  metaRow: { flexDirection:'row', gap:15, marginTop:12 },
  metaItem: { flexDirection:'row', alignItems:'center', gap:5 },
  metaText: { color:'#888', fontSize:12 },

  detailsContainer: { marginTop:5 },
  divider: { height:1, backgroundColor:'#222', marginVertical:10 },
  fullFeedback: { color:'#DDD', fontStyle:'italic', fontSize:13 },
  detailsTitle: { color:'#CCFF00', fontSize:10, fontWeight:'bold', marginBottom:8 },
  exRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  exName: { color:'#FFF', fontSize:12, flex:1, marginRight:10 },
  exLoad: { color:'#888', fontSize:12, fontWeight:'bold' }
});