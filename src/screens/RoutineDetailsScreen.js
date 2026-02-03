import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Dimensions, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const getIconByMuscle = (muscleString = "") => {
    const m = muscleString.toLowerCase();
    if (m.includes('perna') || m.includes('agacha')) return 'weight-lifter';
    if (m.includes('costas')) return 'rowing';
    if (m.includes('peito')) return 'dumbbell';
    if (m.includes('braço') || m.includes('biceps')) return 'arm-flex';
    if (m.includes('ombro')) return 'arrow-up-bold-hexagon-outline';
    return 'flash';
};

export default function RoutineDetailsScreen({ route, navigation }) {
  const { workoutId, workoutName } = route.params;
  const [loading, setLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState([]);
  
  useFocusEffect(
    useCallback(() => {
      fetchRoutineDetails();
    }, [])
  );

  const fetchRoutineDetails = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (!stored) return;
      const user = JSON.parse(stored);
      
      const localLastDay = await AsyncStorage.getItem('@last_completed_day');
      
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${new Date().getTime()}`);
      const data = await response.json();

      if (response.ok && data && data.exercises) {
        // 1. Mapeia os exercícios por dia
        const groups = data.exercises.reduce((acc, item) => {
          const day = item.day || 'A';
          if (!acc[day]) acc[day] = { day: day, muscleGroups: new Set(), exerciseCount: 0 };
          acc[day].exerciseCount++;
          if (item.exercise?.category) acc[day].muscleGroups.add(item.exercise.category);
          return acc;
        }, {});
        
        const sorted = Object.values(groups).sort((a, b) => a.day.localeCompare(b.day));

        // 2. LÓGICA DE VERIFICAÇÃO INDIVIDUAL
        const daysWithStatus = sorted.map((d) => {
            const dayKey = String(d.day).trim().toUpperCase();
            const serverLastDay = data.lastLog && data.lastLog.day ? data.lastLog.day.toUpperCase() : 'OFF';
            const effectiveLastDay = localLastDay || serverLastDay;
            
            const isDone = localLastDay ? (dayKey.charCodeAt(0) <= localLastDay.charCodeAt(0)) : d.completed;

            return { ...d, isDone, isNext: false };
        });

        // 3. SEGUNDA VALIDAÇÃO
        if (data.lastLog && data.lastLog.day) {
            const lastDayChar = data.lastLog.day.toUpperCase();
            const lastIndex = daysWithStatus.findIndex(d => d.day === lastDayChar);
            if (lastIndex !== -1) {
                for (let i = 0; i <= lastIndex; i++) {
                    daysWithStatus[i].isDone = true;
                }
            }
        }

        // 4. DEFINE O PRÓXIMO TREINO
        let nextIndex = daysWithStatus.findIndex(x => !x.isDone);
        if (nextIndex === -1 && daysWithStatus.length > 0) {
            nextIndex = 0;
        }
        if (nextIndex !== -1) daysWithStatus[nextIndex].isNext = true;
        
        setWorkoutDays(daysWithStatus);
      }
    } catch (error) { 
        console.log("Erro ao buscar detalhes:", error); 
    } finally { 
        setLoading(false); 
    }
  };

  const renderCardItem = ({ item }) => {
    // Tratamento simples para Cardio/Descanso se vierem na lista
    const isDescanso = item.day === 'OFF' || item.name?.toUpperCase()?.includes('DESCANSO');
    const isCardio = item.name?.toUpperCase()?.includes('CARDIO');
    const muscleGroupsStr = Array.from(item.muscleGroups).join(', ');
    const iconName = getIconByMuscle(muscleGroupsStr);

    if (isDescanso) {
        return (
          <View style={styles.cardDescanso}>
            <Text style={{color:'#FFF', fontWeight:'bold'}}>🛌 DIA DE OFF</Text>
            <Text style={styles.textApoio}>Recupere suas energias!</Text>
          </View>
        );
    }

    // Variáveis de Estilo do Card
    const cardColor = item.isDone ? '#CCFF00' : (item.isNext ? '#FFF' : '#333');
    const bgOpacity = item.isDone ? '#1A2200' : '#111';

    return (
      <TouchableOpacity 
        style={[
            styles.card, 
            { backgroundColor: bgOpacity, borderColor: item.isDone ? '#CCFF00' : '#222' },
            item.isNext && !item.isDone && styles.nextCardShadow
        ]} 
        onPress={() => navigation.navigate('DayWorkout', { workoutId, day: item.day, workoutName: workoutName })}
      >
        <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: item.isDone ? '#CCFF00' : '#222', borderColor: item.isDone ? '#CCFF00' : '#333', borderWidth:1 }]}>
                <MaterialCommunityIcons 
                    name={item.isDone ? "check-bold" : iconName} 
                    size={24} 
                    color={item.isDone ? "#000" : "#666"} 
                />
            </View>
            <View style={styles.headerInfo}>
                <Text style={[styles.dayText, { color: item.isDone ? '#CCFF00' : '#FFF' }]}>TREINO {item.day}</Text>
                <Text style={styles.muscleText}>{muscleGroupsStr || 'Geral'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#333" />
        </View>

        <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
                <MaterialCommunityIcons name="dumbbell" size={14} color="#555" />
                <Text style={styles.metaText}>{item.exerciseCount} EXERCÍCIOS</Text>
            </View>
            
            {item.isDone ? (
                <View style={styles.statusBadgeDone}>
                    <Text style={styles.statusTextDone}>CONCLUÍDO</Text>
                </View>
            ) : item.isNext ? (
                <View style={styles.statusBadgeNext}>
                    <Text style={styles.statusTextNext}>PRÓXIMA MISSÃO</Text>
                </View>
            ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerLabel}>CRONOGRAMA DE TREINOS</Text>
            <Text style={styles.headerTitle}>{workoutName?.toUpperCase()}</Text>
        </View>
      </View>

      <FlatList 
        data={workoutDays} 
        renderItem={renderCardItem} 
        keyExtractor={item => item.day} 
        contentContainerStyle={styles.list} 
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    // 🔥 CORREÇÃO: Topo Seguro
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor:'#000' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { width: 40, height: 40, backgroundColor: '#111', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerLabel: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  list: { padding: 20, paddingBottom: 50 },
  
  card: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 1.5,
  },
  nextCardShadow: {
    shadowColor: '#CCFF00',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderColor: '#444'
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  dayText: { fontSize: 20, fontWeight: '900' },
  muscleText: { color: '#666', fontSize: 12, textTransform: 'uppercase', marginTop: 2 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: '#555', fontSize: 11, fontWeight: 'bold' },
  
  statusBadgeDone: { backgroundColor: 'rgba(204, 255, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTextDone: { color: '#CCFF00', fontSize: 10, fontWeight: '900' },
  
  statusBadgeNext: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTextNext: { color: '#000', fontSize: 10, fontWeight: '900' },

  cardDescanso: { backgroundColor:'#111', padding:20, borderRadius:15, marginBottom:15, alignItems:'center', borderWidth:1, borderColor:'#222' },
  textApoio: { color:'#666', fontSize:12, marginTop:5 }
});