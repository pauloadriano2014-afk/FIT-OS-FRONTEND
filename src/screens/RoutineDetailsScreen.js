import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Dimensions, Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Shadow } from 'react-native-shadow-2'; // 🔥 Trazendo as sombras para padronizar o design premium

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
            <Text style={{color: theme.text, fontWeight:'bold', fontSize: 16}}>🛌 DIA DE DESCANSO</Text>
            <Text style={[styles.textApoio, { color: theme.textSecondary }]}>Recupere suas energias!</Text>
          </View>
        );
    }

    const borderColor = item.isDone ? theme.accent : theme.border;
    const isDestacado = item.isNext && !item.isDone;

    // 🔥 Adiciona Sombra Customizada
    const shadowOpt = { 
        distance: isDestacado ? 15 : 6, 
        startColor: isDestacado ? (theme.isDark ? theme.accent + '33' : theme.accent + '22') : (theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.03)'), 
        offset: [0, 4] 
    };

    return (
      <View style={{ marginBottom: 20 }}>
        <Shadow {...shadowOpt} containerStyle={{width:'100%'}} style={{width:'100%'}}>
            <TouchableOpacity 
              style={[
                  styles.card, 
                  { backgroundColor: theme.surface, borderColor: borderColor },
                  // Destaca a aba se o aluno clicou "Iniciar Treino" direto da Home
                  initialTab === item.day && !item.isDone && { borderColor: theme.accent, backgroundColor: theme.isDark ? '#1a2200' : theme.accent + '0A' }
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
                  <View style={[styles.goIconBox, { backgroundColor: item.isDone ? 'transparent' : theme.accent + '1A' }]}>
                      <MaterialCommunityIcons name="arrow-right" size={20} color={item.isDone ? theme.accent : theme.accent} />
                  </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.metaInfo}>
                      <MaterialCommunityIcons name="dumbbell" size={14} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.exerciseCount} EXERCÍCIOS</Text>
                  </View>
                  
                  {item.isDone ? (
                      <View style={[styles.statusBadgeDone, { backgroundColor: theme.accent + '22' }]}>
                          <Text style={[styles.statusTextDone, { color: theme.accent }]}>CONCLUÍDO ✅</Text>
                      </View>
                  ) : item.isNext ? (
                      <View style={[styles.statusBadgeNext, { backgroundColor: theme.accent }]}>
                          <Text style={[styles.statusTextNext, { color: theme.isDark ? '#000' : '#FFF' }]}>PRÓXIMA MISSÃO</Text>
                      </View>
                  ) : null}
              </View>
            </TouchableOpacity>
        </Shadow>
      </View>
    );
  };

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';

  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb 
      ? { height: '100vh', width: '100%', backgroundColor: webOuterBg } 
      : { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0 };


  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.accent} /></View>;

  return (
    <RootComponent style={rootStyle}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      
      {/* CONTAINER CENTRALIZADO PARA PC/PWA */}
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
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
            // 🔥 Isso garante que o FlatList vai "scrollar" no Web corretamente sem encavalar
            style={isWeb ? { flex: 1, width: '100%', overflowY: 'auto' } : { flex: 1, width: '100%' }} 
          />
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 20, paddingTop: 15, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerLabel: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', maxWidth: width - 100 },
  
  list: { padding: 20, paddingBottom: 80 },
  
  card: { 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 1.5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginRight: 10 },
  dayText: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  muscleText: { fontSize: 11, textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
  
  goIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, fontWeight: 'bold' },
  
  statusBadgeDone: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusTextDone: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  
  statusBadgeNext: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  statusTextNext: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  cardDescanso: { padding:30, borderRadius:24, marginBottom:20, alignItems:'center', borderWidth:1, borderStyle: 'dashed' },
  textApoio: { fontSize:13, marginTop:8 }
});