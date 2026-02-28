import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Dimensions, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

/* 🔥 IMPORTAÇÃO DO TEMA GLOBAL */
import { useTheme } from '../contexts/ThemeContext';

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
  const { workoutId, workoutName, initialTab } = route.params;
  const [loading, setLoading] = useState(true);
  const [workoutDays, setWorkoutDays] = useState([]);
  
  // 🔥 PUXA AS CORES DO CONTEXTO
  const { theme } = useTheme();
  
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
        
        // 1. Agrupa os exercícios pelos nomes customizados
        const groups = data.exercises.reduce((acc, item) => {
          const day = item.day || 'Treino';
          if (!acc[day]) acc[day] = { day: day, muscleGroups: new Set(), exerciseCount: 0 };
          acc[day].exerciseCount++;
          if (item.exercise?.category) acc[day].muscleGroups.add(item.exercise.category);
          return acc;
        }, {});
        
        // 2. Transforma em array mantendo a ordem original inserida no banco
        const daysArray = Object.values(groups);

        const serverLastDay = data.lastLog && data.lastLog.day ? data.lastLog.day : null;
        const effectiveLastDay = localLastDay || serverLastDay;

        // 3. Lógica para definir o que já foi concluído baseada na ordem do array
        let lastCompletedIndex = -1;
        if (effectiveLastDay) {
             lastCompletedIndex = daysArray.findIndex(d => d.day === effectiveLastDay);
        }

        const daysWithStatus = daysArray.map((d, index) => {
            const isDone = lastCompletedIndex !== -1 && index <= lastCompletedIndex;
            return { ...d, isDone, isNext: false };
        });

        // 4. Marca o "Próximo"
        let nextIndex = daysWithStatus.findIndex(x => !x.isDone);
        if (nextIndex === -1 && daysWithStatus.length > 0) {
            nextIndex = 0; // Se tudo estiver concluído, o próximo volta a ser o primeiro
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
    const isDescanso = item.day.toUpperCase() === 'OFF' || item.day.toUpperCase().includes('DESCANSO');
    const muscleGroupsStr = Array.from(item.muscleGroups).join(', ');
    const iconName = getIconByMuscle(muscleGroupsStr);

    if (isDescanso) {
        return (
          <View style={[styles.cardDescanso, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{color: theme.text, fontWeight:'bold'}}>🛌 DIA DE DESCANSO</Text>
            <Text style={[styles.textApoio, { color: theme.textSecondary }]}>Recupere suas energias!</Text>
          </View>
        );
    }

    const borderColor = item.isDone ? theme.accent : theme.border;
    const shadowColor = item.isNext && !item.isDone ? theme.accent : 'transparent';

    return (
      <TouchableOpacity 
        style={[
            styles.card, 
            { backgroundColor: theme.surface, borderColor: borderColor },
            item.isNext && !item.isDone && { shadowColor: shadowColor, shadowOpacity: 0.1, shadowRadius: 15, elevation: 5 },
            // Destaca a aba se o aluno clicou "Iniciar Treino" direto da Home
            initialTab === item.day && !item.isDone && { borderColor: theme.accent, backgroundColor: theme.isDark ? '#1a2200' : theme.accent + '11' }
        ]} 
        onPress={() => navigation.navigate('DayWorkout', { workoutId, day: item.day, workoutName: workoutName })}
      >
        <View style={styles.cardHeader}>
            <View style={[
                styles.iconCircle, 
                { backgroundColor: item.isDone ? theme.accent : theme.bg, borderColor: item.isDone ? theme.accent : theme.border, borderWidth: 1 }
            ]}>
                <MaterialCommunityIcons 
                    name={item.isDone ? "check-bold" : iconName} 
                    size={24} 
                    color={item.isDone ? (theme.isDark ? "#000" : "#FFF") : theme.textSecondary} 
                />
            </View>
            <View style={styles.headerInfo}>
                <Text style={[styles.dayText, { color: item.isDone ? theme.accent : theme.text }]} numberOfLines={1}>{item.day.toUpperCase()}</Text>
                <Text style={[styles.muscleText, { color: theme.textSecondary }]}>{muscleGroupsStr || 'Geral'}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </View>

        <View style={styles.cardFooter}>
            <View style={styles.metaInfo}>
                <MaterialCommunityIcons name="dumbbell" size={14} color={theme.textSecondary} />
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.exerciseCount} EXERCÍCIOS</Text>
            </View>
            
            {item.isDone ? (
                <View style={[styles.statusBadgeDone, { backgroundColor: theme.accent + '22' }]}>
                    <Text style={[styles.statusTextDone, { color: theme.accent }]}>CONCLUÍDO</Text>
                </View>
            ) : item.isNext ? (
                <View style={[styles.statusBadgeNext, { backgroundColor: theme.text }]}>
                    <Text style={[styles.statusTextNext, { color: theme.bg }]}>PRÓXIMA MISSÃO</Text>
                </View>
            ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
            <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>CRONOGRAMA DE TREINOS</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{workoutName?.toUpperCase()}</Text>
        </View>
      </View>

      <FlatList 
        data={workoutDays} 
        renderItem={renderCardItem} 
        keyExtractor={item => item.day} 
        contentContainerStyle={styles.list} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerLabel: { fontSize: 10, fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: '900', maxWidth: width - 100 },
  list: { padding: 20, paddingBottom: 50 },
  
  card: { 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 1.5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginRight: 10 },
  dayText: { fontSize: 18, fontWeight: '900' },
  muscleText: { fontSize: 12, textTransform: 'uppercase', marginTop: 2 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, fontWeight: 'bold' },
  
  statusBadgeDone: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTextDone: { fontSize: 10, fontWeight: '900' },
  
  statusBadgeNext: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTextNext: { fontSize: 10, fontWeight: '900' },

  cardDescanso: { padding:20, borderRadius:15, marginBottom:15, alignItems:'center', borderWidth:1 },
  textApoio: { fontSize:12, marginTop:5 }
});