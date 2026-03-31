// App.js
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

/* ================= IMPORTAÇÃO DO TEMA ================= */
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

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
import BibliotecaScreen from './src/screens/BibliotecaScreen'; 
import PDFViewerScreen from './src/screens/PDFViewerScreen'; 
import VideoPlayerScreen from './src/screens/VideoPlayerScreen'; 
import AudioPlayerScreen from './src/screens/AudioPlayerScreen';

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

/* ================= NAVIGATORS E REFS ================= */
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 🔥 Referência global para navegação forçada (Fuga do Login Web)
const navigationRef = createNavigationContainerRef();

/* ---------- ALUNO TABS ---------- */
function StudentTabs({ route }) {
  const userData = route.params?.userData;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopColor: theme.border,
          borderTopWidth: 1
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      })}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeScreen} 
        initialParams={{ userData }} 
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Treinos" 
        component={TrainingScreen} 
        initialParams={{ userData }} 
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Biblioteca" 
        component={BibliotecaScreen} 
        initialParams={{ userData }} 
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="play-box-multiple" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Evolução" 
        component={EvolutionScreen} 
        initialParams={{ userData }} 
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" size={size} color={color} /> }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileScreen} 
        initialParams={{ userData }} 
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

/* ================= NAVEGAÇÃO PRINCIPAL ================= */
function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [savedUser, setSavedUser] = useState(null);
  const { theme, loadingTheme } = useTheme();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const role = await AsyncStorage.getItem('role'); 

        if (userJson) {
          const user = JSON.parse(userJson);
          const finalRole = role || user.role || user.type; 

          if (finalRole) {
            setSavedUser(user);
            
            const targetRoute = finalRole.toLowerCase() === 'admin' ? 'AdminDashboard' : 'Main';
            setInitialRoute(targetRoute);
            
            // 🔥 A VOADORA NO LOGIN: Assim que monta, força o usuário logado para a Home
            // Isso anula a regra do Deep Linking web que quer manter o cara no Login
            setTimeout(() => {
                if (navigationRef.isReady()) {
                    if (targetRoute === 'AdminDashboard') {
                        navigationRef.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
                    } else {
                        navigationRef.reset({ index: 0, routes: [{ name: 'Main', params: { userData: user } }] });
                    }
                }
            }, 100);

            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Erro ao restaurar sessão:', e);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (!loading && savedUser) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          fetch('https://fitos-final.onrender.com/api/user/push-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: savedUser.id, token })
          }).catch(() => {});
        }
      });
    }
  }, [loading, savedUser]);

  // 🔥 BARREIRA DE TELA DE CARREGAMENTO:
  // Enquanto o loading for true, NENHUMA tela é montada, impedindo o app de exibir o Login sem querer.
  if (loading || loadingTheme) {
    return (
      <View style={{ flex: 1, backgroundColor: theme?.bg || '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme?.accent || '#CCFF00'} />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Anamnese" component={AnamneseScreen} />
      <Stack.Screen name="AnamneseVIP" component={AnamneseVIPScreen} />

      <Stack.Screen name="Main" component={StudentTabs} initialParams={{ userData: savedUser }} />
      <Stack.Screen name="RoutineDetails" component={RoutineDetailsScreen} />
      <Stack.Screen name="DayWorkout" component={DayWorkoutScreen} />
      <Stack.Screen name="FinishScreen" component={FinishScreen} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} />
      <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
      <Stack.Screen name="ScannerIA" component={AIScannerModal} />
      <Stack.Screen name="Biblioteca" component={BibliotecaScreen} />
      
      <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />

      <Stack.Screen name="PAFlix" component={PAFlixScreen} />

      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="MontarTreinoAdmin" component={MontarTreinoAdmin} />
      <Stack.Screen name="BibliotecaAdmin" component={BibliotecaAdmin} />
      <Stack.Screen name="GerenciarTemplates" component={GerenciarTemplates} />
      <Stack.Screen name="AdminAlunoOptions" component={AdminUserOptions} />
      <Stack.Screen name="AdminEvolution" component={AdminEvolutionScreen} />
      <Stack.Screen name="AdminAddContent" component={AdminAddContent} />
    </Stack.Navigator>
  );
}

/* ================= DEEP LINKING ================= */
// Removemos a amarração explícita do Login à raiz ('/') 
// O App decide sozinho baseado na memória.
const linking = {
  prefixes: ['https://www.pauloadrianoteam.com.br', 'https://pauloadrianoteam.com.br'],
  config: {
    screens: {
      Register: 'registro', 
    }
  }
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {/* 🔥 NAVIGATION REF INJETADA AQUI */}
        <NavigationContainer ref={navigationRef} linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}