// src/screens/RoutineDetailsScreen.js
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, 
  ActivityIndicator, StatusBar, Dimensions, Platform, Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Shadow } from 'react-native-shadow-2'; 

import { useTheme } from '../contexts/ThemeContext';
import { authHeaders } from '../utils/authToken';

const { width } = Dimensions.get('window');

const getIconByMuscle = (muscleString = "") => {
    const m = muscleString.toLowerCase();
    if (m.includes('perna') || m.includes('agacha') || m.includes('quad')) return 'weight-lifter';
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
      
      const localCompleted = await AsyncStorage.getItem(`@completed_days_${workoutId}`);
      let completedDays = localCompleted ? JSON.parse(localCompleted) : [];
      completedDays = completedDays.map(d => String(d).trim().toUpperCase()); 
      
      const response = await fetch(`https://fitos-final.onrender.com/api/workout?userId=${user.id}&workoutId=${workoutId}&t=${new Date().getTime()}`, { headers: { ...(await authHeaders()) } });
      const data = await response.json();

      if (response.ok && data && data.exercises) {
        
        const groups = data.exercises.reduce((acc, item) => {
          const day = item.day || 'Treino';
          if (!acc[day]) acc[day] = { day: day, muscleGroups: new Set(), exerciseCount: 0 };
          acc[day].exerciseCount++;
          if (item.exercise?.category) acc[day].muscleGroups.add(item.exercise.category);
          return acc;
        }, {});
        
        const daysArray = Object.values(groups);

        const daysWithStatus = daysArray.map((d) => {
            const normDay = String(d.day).trim().toUpperCase();
            const isDone = completedDays.includes(normDay); 
            return { ...d, isDone, isNext: false, normDay };
        });

        let nextIndex = daysWithStatus.findIndex(x => !x.isDone && !(x.day.toUpperCase() === 'OFF' || x.day.toUpperCase().includes('DESCANSO')));
        if (nextIndex !== -1) {
            daysWithStatus[nextIndex].isNext = true;
        }
        
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
            <View style={[styles.descansoIconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="bed-empty" size={24} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{color: theme.text, fontWeight:'900', fontSize: 15, letterSpacing: 0.5}}>DIA DE DESCANSO</Text>
                <Text style={[styles.textApoio, { color: theme.textSecondary }]}>Recupere suas energias. O músculo cresce agora!</Text>
            </View>
          </View>
        );
    }

    const isDestacado = item.isNext && !item.isDone;
    const isCompleted = item.isDone;

    const borderColor = isDestacado ? theme.accent : (isCompleted ? theme.border : theme.border);
    const bgColor = isCompleted ? (theme.isDark ? '#111' : '#f5f5f5') : theme.surface;

    const shadowOpt = { 
        distance: isDestacado ? 15 : 4, 
        startColor: isDestacado ? (theme.isDark ? theme.accent + '25' : theme.accent + '22') : (theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)'), 
        offset: [0, 4] 
    };

    return (
      <View style={{ marginBottom: 20 }}>
        <Shadow {...shadowOpt} containerStyle={{width:'100%'}} style={{width:'100%'}}>
            <TouchableOpacity 
              style={[
                  styles.card, 
                  { backgroundColor: bgColor, borderColor: borderColor, opacity: isCompleted ? 0.8 : 1 },
                  initialTab === item.day && !item.isDone && !isDestacado && { borderColor: theme.accent, backgroundColor: theme.isDark ? '#1a2200' : theme.accent + '0A' }
              ]} 
              onPress={() => navigation.navigate('DayWorkout', { workoutId, day: item.day, workoutName: workoutName })}
              activeOpacity={0.9}
            >
              {isDestacado && (
                  <View style={[styles.destaqueBadge, { backgroundColor: theme.accent }]}>
                      <Text style={[styles.destaqueText, { color: theme.isDark ? '#000' : '#FFF' }]}>SUA MISSÃO HOJE</Text>
                  </View>
              )}

              <View style={styles.cardHeader}>
                  <View style={[ styles.iconCircle, { backgroundColor: isCompleted ? theme.bg : theme.accent + '15', borderColor: isCompleted ? theme.border : theme.accent + '40', borderWidth: 1 } ]}>
                      <MaterialCommunityIcons name={isCompleted ? "check-all" : iconName} size={26} color={isCompleted ? theme.accent : theme.accent} />
                  </View>
                  
                  <View style={styles.headerInfo}>
                      <Text style={[styles.dayText, { color: isCompleted ? theme.textSecondary : theme.text }]} numberOfLines={1}>{item.day.toUpperCase()}</Text>
                      <Text style={[styles.muscleText, { color: theme.textSecondary }]}>{muscleGroupsStr || 'Geral'}</Text>
                  </View>
              </View>

              <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.metaInfo}>
                      <MaterialCommunityIcons name="format-list-numbered" size={16} color={theme.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.exerciseCount} EXERCÍCIOS</Text>
                  </View>
                  
                  <View style={[styles.actionBtn, { backgroundColor: isCompleted ? theme.bg : theme.accent, borderColor: isCompleted ? theme.border : theme.accent, borderWidth: 1 }]}>
                      <Text style={[styles.actionBtnText, { color: isCompleted ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF') }]}>
                          {isCompleted ? 'REVISAR' : 'INICIAR TREINO'}
                      </Text>
                      <MaterialCommunityIcons name={isCompleted ? "eye-outline" : "play"} size={16} color={isCompleted ? theme.textSecondary : (theme.isDark ? '#000' : '#FFF')} />
                  </View>
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
      
      <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
          
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
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
            style={isWeb ? { flex: 1, width: '100%', overflowY: 'auto' } : { flex: 1, width: '100%' }} 
          />
      </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 15, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, paddingBottom: 20, elevation: 2, zIndex: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '900' },
  
  list: { padding: 20, paddingBottom: 80, paddingTop: 30 },
  
  card: { borderRadius: 24, padding: 20, borderWidth: 1.5, position: 'relative' },
  destaqueBadge: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, zIndex: 10 },
  destaqueText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  iconCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  dayText: { fontSize: 22, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  muscleText: { fontSize: 11, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.5 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 11, fontWeight: '800' },
  
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  actionBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  cardDescanso: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderStyle: 'dashed' },
  descansoIconBox: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  textApoio: { fontSize: 12, marginTop: 4, lineHeight: 18 }
});