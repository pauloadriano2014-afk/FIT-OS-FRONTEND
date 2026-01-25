import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const getIconByMuscle = (muscleString = "") => {
    const m = muscleString.toLowerCase();
    if (m.includes('perna') || m.includes('agacha')) return 'weight-lifter';
    if (m.includes('costas')) return 'rowing';
    if (m.includes('peito')) return 'dumbbell';
    if (m.includes('braço') || m.includes('biceps')) return 'arm-flex';
    return 'flash';
};

export default function RoutineDetailsScreen({ route, navigation }) {
  const { workoutId, workoutName } = route.params;
  const [loading, setLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState([]);
  
  // 🔥 Novo estado para saber a data do último treino
  const [lastLogDate, setLastLogDate] = useState(null);

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
      
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${Date.now()}`);
      const data = await response.json();

      if (response.ok && data && data.exercises) {
        // 🔥 Salva a data do lastLog se existir
        if (data.lastLog && data.lastLog.date) {
            setLastLogDate(data.lastLog.date);
        } else {
            setLastLogDate(null);
        }

        const groups = data.exercises.reduce((acc, item) => {
          const day = item.day || 'A';
          if (!acc[day]) acc[day] = { day: day, muscleGroups: new Set(), exerciseCount: 0 };
          acc[day].exerciseCount++;
          if (item.exercise?.category) acc[day].muscleGroups.add(item.exercise.category);
          return acc;
        }, {});
        
        const sorted = Object.values(groups).sort((a, b) => a.day.localeCompare(b.day));
        
        // Lógica de Progresso
        const doneDaysSet = new Set();
        
        if (data.lastLog && data.lastLog.day) {
             const lastDayChar = data.lastLog.day;
             const indexLast = sorted.findIndex(d => d.day === lastDayChar);
             if (indexLast !== -1) {
                 for(let i=0; i<=indexLast; i++) doneDaysSet.add(sorted[i].day);
             } else {
                 doneDaysSet.add(lastDayChar);
             }
        }

        const daysWithStatus = sorted.map((d) => {
            const dayKey = String(d.day).trim().toUpperCase();
            const isDone = doneDaysSet.has(dayKey);
            return { ...d, isDone, isNext: false };
        });

        let nextIndex = daysWithStatus.findIndex(x => !x.isDone);
        if (nextIndex === -1 && daysWithStatus.length > 0) nextIndex = 0;
        if (nextIndex !== -1) daysWithStatus[nextIndex].isNext = true;
        
        setWorkoutDays(daysWithStatus);
      }
    } catch (error) { console.log(error); } finally { setLoading(false); }
  };

  const renderMetroItem = ({ item, index }) => {
    const muscleGroupsStr = Array.from(item.muscleGroups).join(', ');
    const iconName = getIconByMuscle(muscleGroupsStr);
    const isLastItem = index === workoutDays.length - 1;

    const lineColor = item.isDone ? '#CCFF00' : '#333';
    const dotColor = item.isDone ? '#CCFF00' : (item.isNext ? '#FFF' : '#333');
    const dotBg = item.isDone ? '#CCFF00' : '#000';

    // 🔥 LÓGICA INTELIGENTE DE DATA 🔥
    let badgeText = "SUGESTÃO DE HOJE";
    
    // Se este item é o próximo...
    if (item.isNext) {
        // ... verificamos se o último treino foi HOJE
        if (lastLogDate) {
            const lastDate = new Date(lastLogDate);
            const today = new Date();
            
            // Compara Dia, Mês e Ano
            const isToday = lastDate.getDate() === today.getDate() &&
                            lastDate.getMonth() === today.getMonth() &&
                            lastDate.getFullYear() === today.getFullYear();

            if (isToday) {
                badgeText = "SUGESTÃO PARA AMANHÃ";
            }
        }
    }

    return (
      <View style={styles.metroContainer}>
        <View style={styles.metroLeft}>
            {!isLastItem && <View style={[styles.metroLine, { backgroundColor: lineColor }]} />}
            <View style={[styles.metroNode, { borderColor: dotColor, backgroundColor: dotBg }]}>
                {item.isDone && <MaterialCommunityIcons name="check" size={14} color="#000" />}
                {item.isNext && !item.isDone && <View style={styles.pulseDot} />}
            </View>
        </View>

        <TouchableOpacity 
          style={[styles.card, item.isNext && styles.activeCard]} 
          onPress={() => navigation.navigate('DayWorkout', { 
              workoutId, day: item.day, workoutName: workoutName 
          })}
        >
          <View style={styles.headerRow}>
              <Text style={[styles.cardTitle, (item.isDone || item.isNext) && {color: item.isDone ? '#CCFF00' : '#FFF'}]}>TREINO {item.day}</Text>
              <MaterialCommunityIcons name={iconName} size={22} color={(item.isDone || item.isNext) ? "#CCFF00" : "#666"} />
          </View>
          
          <Text style={styles.cardSubtitle}>{muscleGroupsStr || 'Fullbody'}</Text>
          
          <View style={styles.footerRow}>
             <Text style={styles.cardMeta}>{item.exerciseCount} exercícios</Text>
             {/* 🔥 EXIBE O TEXTO DINÂMICO AQUI */}
             {item.isNext && <View style={[styles.startBadge, badgeText.includes("AMANHÃ") && {backgroundColor:'#333'}]}>
                 <Text style={[styles.startText, badgeText.includes("AMANHÃ") && {color:'#FFF'}]}>{badgeText}</Text>
             </View>}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#CCFF00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{workoutName?.toUpperCase()}</Text>
      </View>
      <FlatList 
        data={workoutDays} 
        renderItem={renderMetroItem} 
        keyExtractor={item => item.day} 
        contentContainerStyle={styles.list} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor:'#000' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  backBtn: { padding: 5 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  list: { padding: 20, paddingBottom: 50 },
  metroContainer: { flexDirection: 'row', minHeight: 120 }, 
  metroLeft: { width: 40, alignItems: 'center' },
  metroLine: { position: 'absolute', top: 30, bottom: -30, width: 3, zIndex: -1 }, 
  metroNode: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 15, zIndex: 2 },
  pulseDot: { width: 8, height: 8, backgroundColor: '#FFF', borderRadius: 4 },
  card: { flex: 1, backgroundColor: '#111', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#222', marginBottom: 20 },
  activeCard: { borderColor: '#FFF', backgroundColor: '#161810', shadowColor: '#CCFF00', shadowOpacity: 0.1, shadowRadius: 10 }, 
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#888', fontSize: 18, fontWeight: '900' },
  cardSubtitle: { color: '#666', fontSize: 12, marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  cardMeta: { color: '#555', fontSize: 10, fontWeight: 'bold' },
  startBadge: { backgroundColor: '#CCFF00', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  startText: { color: '#000', fontSize: 9, fontWeight: '900' }
});