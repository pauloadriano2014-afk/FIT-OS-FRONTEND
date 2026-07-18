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
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

import InstallScreen from './src/screens/InstallScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnamneseScreen from './src/screens/AnamneseScreen';
import AnamneseVIPScreen from './src/screens/AnamneseVIPScreen';
import SetupTreinoScreen from './src/screens/SetupTreinoScreen';
import PropostaScreen from './src/screens/PropostaScreen';
import PropostaStartScreen from './src/screens/PropostaStartScreen';
import PropostaMaesScreen from './src/screens/PropostaMaesScreen';
import PropostaNavegantesScreen from './src/screens/PropostaNavegantesScreen';
import PropostaFamiliaScreen from './src/screens/PropostaFamiliaScreen';
import SaaSPropostaScreen from './src/screens/SaaSPropostaScreen';
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
import DietScreen from './src/screens/DietScreen';
import RoutineDetailsScreen from './src/screens/RoutineDetailsScreen';
import DayWorkoutScreen from './src/screens/DayWorkoutScreen';
import FinishScreen from './src/screens/FinishScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import MontarTreinoAdmin from './src/screens/MontarTreinoAdmin';
import BibliotecaAdmin from './src/screens/BibliotecaAdmin';
import GerenciarTemplates from './src/screens/GerenciarTemplates';
import AdminUserOptions from './src/screens/AdminUserOptions';
import AdminEvolutionScreen from './src/screens/AdminEvolutionScreen';
import AdminAddContent from './src/screens/AdminAddContent';
import AdminStudentCheckinsScreen from './src/screens/AdminStudentCheckinsScreen';
import AdminIALabScreen from './src/screens/AdminIALabScreen';
import AdminDietScreen from './src/screens/AdminDietScreen';
import AdminDietLibraryScreen from './src/screens/AdminDietLibraryScreen';
import AIScannerModal from './src/components/AIScannerModal';
import LaboratoryScreen from './src/screens/LaboratoryScreen';
import LaboratoryBuilderScreen from './src/screens/LaboratoryBuilderScreen';
import LaboratoryFinalScreen from './src/screens/LaboratoryFinalScreen';
import GerarTreinoIA from './src/screens/GerarTreinoIA';
import AdminTechniquesScreen from './src/screens/AdminTechniquesScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AdminFoodManagerScreen from './src/screens/AdminFoodManagerScreen';
import AdminSubstitutionGroupsScreen from './src/screens/AdminSubstitutionGroupsScreen';
import AdminSubstitutionGroupDetailScreen from './src/screens/AdminSubstitutionGroupDetailScreen';
import AdminCoachesScreen from './src/screens/AdminCoachesScreen';

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

function StudentTabs({ route }) {
  const [userData, setUserData] = useState(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      let u = route.params?.userData;
      if (typeof u === 'string') u = JSON.parse(u);
      if (!u || !u.id) {
        const saved = await AsyncStorage.getItem('user');
        if (saved) u = JSON.parse(saved);
      }
      if (u) {
        setUserData(u);
        try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${u.id}?t=${Date.now()}`);
          if (res.ok) {
            const fresh = await res.json();
            setUserData(fresh);
            AsyncStorage.setItem('user', JSON.stringify(fresh));
          }
        } catch (e) { console.log("Erro refresh user", e); }
      }
    };
    loadUser();
  }, [route.params?.userData]);

  if (!userData) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const MASTER_COACH_IDS = ['3c82f763-66b4-48da-836e-16817d4f57c0', 'b7c0c181-41fd-4156-b8fe-963a267759a3'];
  const belongsToMaster =
    !userData?.coachId ||
    MASTER_COACH_IDS.includes(userData?.coachId) ||
    MASTER_COACH_IDS.includes(userData?.nutritionistId);

  const isElite = userData?.plan === 'ELITE' || userData?.plan === 'VIP';
  const showDiet = (userData?.dietModule === true || isElite) && belongsToMaster;

  return (
    <Tab.Navigator
      screenOptions={{
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
      }}
    >
      <Tab.Screen name="Início" component={HomeScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} /> }} />
      <Tab.Screen name="Treinos" component={TrainingScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" size={size} color={color} /> }} />
      {showDiet && (
        <Tab.Screen name="Dieta" component={DietScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="food-apple" size={size} color={color} /> }} />
      )}
      <Tab.Screen name="Biblioteca" component={BibliotecaScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="play-box-multiple" size={size} color={color} /> }} />
      <Tab.Screen name="Evolução" component={EvolutionScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" size={size} color={color} /> }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Install');
  const [savedUser, setSavedUser] = useState(null);
  const { theme, loadingTheme } = useTheme();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const role = await AsyncStorage.getItem('role');
        if (userJson) {
          const user = JSON.parse(userJson);
          setSavedUser(user);
          const finalRole = role || user.role || user.type || 'ALUNO';
          if (finalRole.toLowerCase() === 'admin') {
            setInitialRoute('AdminDashboard');
          } else {
            setInitialRoute('Main');
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

  if (loading || loadingTheme) {
    return (
      <View style={{ flex: 1, backgroundColor: theme?.bg || '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme?.accent || '#CCFF00'} />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Install" component={InstallScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="RedefinirSenha" component={ResetPasswordScreen} />
      <Stack.Screen name="Anamnese" component={AnamneseScreen} options={{ headerShown: false, tabBarVisible: false }} />
      <Stack.Screen name="AnamneseVIP" component={AnamneseVIPScreen} />
      <Stack.Screen name="SetupTreino" component={SetupTreinoScreen} />
      <Stack.Screen name="Proposta" component={PropostaScreen} />
      <Stack.Screen name="PropostaStart" component={PropostaStartScreen} />
      <Stack.Screen name="PropostaMaes" component={PropostaMaesScreen} />
      <Stack.Screen name="PropostaNavegantes" component={PropostaNavegantesScreen} />
      <Stack.Screen name="PropostaFamilia" component={PropostaFamiliaScreen} />
      <Stack.Screen name="SaaSProposta" component={SaaSPropostaScreen} />
      <Stack.Screen name="Main" component={StudentTabs} initialParams={{ userData: savedUser }} />
      <Stack.Screen name="RoutineDetails" component={RoutineDetailsScreen} />
      <Stack.Screen name="DayWorkoutScreen" component={DayWorkoutScreen} />
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
      <Stack.Screen name="AdminStudentCheckins" component={AdminStudentCheckinsScreen} />
      <Stack.Screen name="AdminIALabScreen" component={AdminIALabScreen} />
      <Stack.Screen name="AdminDietScreen" component={AdminDietScreen} />
      <Stack.Screen name="AdminDietLibraryScreen" component={AdminDietLibraryScreen} />
      <Stack.Screen name="LaboratoryScreen" component={LaboratoryScreen} />
      <Stack.Screen name="LaboratoryBuilderScreen" component={LaboratoryBuilderScreen} />
      <Stack.Screen name="LaboratoryFinalScreen" component={LaboratoryFinalScreen} />
      <Stack.Screen name="GerarTreinoIA" component={GerarTreinoIA} options={{ headerShown: false }} />
      <Stack.Screen name="AdminTechniquesScreen" component={AdminTechniquesScreen} />
      <Stack.Screen name="AdminFoodManagerScreen" component={AdminFoodManagerScreen} />
      <Stack.Screen name="AdminSubstitutionGroupsScreen" component={AdminSubstitutionGroupsScreen} />
<Stack.Screen name="AdminSubstitutionGroupDetailScreen" component={AdminSubstitutionGroupDetailScreen} />
<Stack.Screen name="AdminCoachesScreen" component={AdminCoachesScreen} />
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: [
    'https://www.pauloadrianoteam.com.br',
    'https://pauloadrianoteam.com.br',
    'http://localhost:8081',
    'http://localhost:8082'
  ],
  filter: (url) => {
    if (url.includes('/corrida/')) return false;
    return true;
  },
  config: {
    screens: {
      Install: { path: 'registro' },
      Proposta: { path: 'Proposta' },
      PropostaStart: { path: 'PropostaStart' },
      PropostaMaes: { path: 'PropostaMaes' },
      PropostaNavegantes: { path: 'PropostaNavegantes' },
      PropostaFamilia: { path: 'PropostaFamilia' },
      SaaSProposta: {
        path: 'invite/:coachId',
        parse: {
          coachId: (v) => String(v),
        },
        stringify: {
          coachId: (v) => v,
        },
      },
      RedefinirSenha: {
        path: 'redefinir-senha',
        parse: {
          token: (v) => String(v),
        },
        stringify: {
          token: (v) => v,
        },
      },
      AdminDashboard: { path: 'admin' },
      AdminStudentCheckins: {
        path: 'admin-checkins',
        parse: {
          alunoId: (v) => String(v),
          alunoName: (v) => decodeURIComponent(v),
        },
        stringify: {
          alunoId: (v) => v,
          alunoName: (v) => encodeURIComponent(v),
        },
      },
      AdminEvolution: {
        path: 'admin-evolution',
        parse: {
          alunoId: (v) => String(v),
          alunoName: (v) => decodeURIComponent(v),
        },
        stringify: {
          alunoId: (v) => v,
          alunoName: (v) => encodeURIComponent(v),
        },
      },
      AdminAlunoOptions: {
        path: 'admin-aluno',
        parse: {
          alunoId: (v) => String(v),
        },
        stringify: {
          alunoId: (v) => v,
        },
      },
    }
  }
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}