import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

/* ================= TELAS ================= */

// AUTH
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnamneseScreen from './src/screens/AnamneseScreen';
import AnamneseVIPScreen from './src/screens/AnamneseVIPScreen';

// ALUNO
import HomeScreen from './src/screens/HomeScreen';
import TrainingScreen from './src/screens/TrainingScreen';
import EvolutionScreen from './src/screens/EvolutionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import UserHistoryScreen from './src/screens/UserHistoryScreen';
import PAFlixScreen from './src/screens/PAFlixScreen';

// TREINO
import RoutineDetailsScreen from './src/screens/RoutineDetailsScreen';
import DayWorkoutScreen from './src/screens/DayWorkoutScreen';
import FinishScreen from './src/screens/FinishScreen';

// ADMIN
import AdminDashboard from './src/screens/AdminDashboard';
import MontarTreinoAdmin from './src/screens/MontarTreinoAdmin';
import BibliotecaAdmin from './src/screens/BibliotecaAdmin';
import GerenciarTemplates from './src/screens/GerenciarTemplates';
import AdminUserOptions from './src/screens/AdminUserOptions';
import AdminEvolutionScreen from './src/screens/AdminEvolutionScreen';
import AdminAddContent from './src/screens/AdminAddContent';

// GLOBAL
import AIScannerModal from './src/components/AIScannerModal';

/* ================= NOTIFICATIONS ================= */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX
    });
  }

  if (Device.isDevice) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      if (req.status !== 'granted') return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
}

/* ================= NAVIGATORS ================= */

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ---------- ALUNO TABS ---------- */
function StudentTabs({ route }) {
  const userData = route.params?.userData;
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#080808',
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom
        },
        tabBarActiveTintColor: '#CCFF00',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Início: 'home',
            Treinos: 'dumbbell',
            'PA FLIX': 'play-circle-outline',
            Evolução: 'chart-line',
            Perfil: 'account'
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        }
      })}
    >
      <Tab.Screen name="Início" component={HomeScreen} initialParams={{ userData }} />
      <Tab.Screen name="Treinos" component={TrainingScreen} initialParams={{ userData }} />
      <Tab.Screen name="PA FLIX" component={PAFlixScreen} initialParams={{ userData }} />
      <Tab.Screen name="Evolução" component={EvolutionScreen} initialParams={{ userData }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} initialParams={{ userData }} />
    </Tab.Navigator>
  );
}

/* ================= APP ================= */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [savedUser, setSavedUser] = useState(null);

  /* ---------- RESTAURA SESSÃO (CRÍTICO) ---------- */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const role = await AsyncStorage.getItem('role');

        if (userJson && role) {
          const user = JSON.parse(userJson);
          setSavedUser(user);

          if (role === 'admin') {
            setInitialRoute('AdminDashboard');
          } else if (role === 'student') {
            setInitialRoute('Main');
          } else {
            setInitialRoute('Login');
          }

          console.log('🔄 Sessão restaurada:', role, user.email);
        }
      } catch (e) {
        console.log('Erro ao restaurar sessão:', e);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* ---------- PUSH TOKEN ---------- */
  useEffect(() => {
    if (!loading && savedUser) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          fetch('https://fitos-final.onrender.com/api/user/push-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: savedUser.id,
              token
            })
          }).catch(() => {});
        }
      });
    }
  }, [loading, savedUser]);

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  /* ---------- NAVIGATION ---------- */
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          {/* AUTH */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Anamnese" component={AnamneseScreen} />
          <Stack.Screen name="AnamneseVIP" component={AnamneseVIPScreen} />

          {/* ALUNO */}
          <Stack.Screen
            name="Main"
            component={StudentTabs}
            initialParams={{ userData: savedUser }}
          />
          <Stack.Screen name="RoutineDetails" component={RoutineDetailsScreen} />
          <Stack.Screen name="DayWorkout" component={DayWorkoutScreen} />
          <Stack.Screen name="FinishScreen" component={FinishScreen} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} />
          <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
          <Stack.Screen name="ScannerIA" component={AIScannerModal} />

          {/* ADMIN */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="MontarTreinoAdmin" component={MontarTreinoAdmin} />
          <Stack.Screen name="BibliotecaAdmin" component={BibliotecaAdmin} />
          <Stack.Screen name="GerenciarTemplates" component={GerenciarTemplates} />
          <Stack.Screen name="AdminAlunoOptions" component={AdminUserOptions} />
          <Stack.Screen name="AdminEvolution" component={AdminEvolutionScreen} />
          <Stack.Screen name="AdminAddContent" component={AdminAddContent} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
