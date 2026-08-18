import 'react-native-gesture-handler';
// 🔥 IMPORT ESTÁTICO (NÃO mover pra lazy!) — registra o listener do
// beforeinstallprompt assim que o app carrega. Ver comentário completo em
// src/utils/pwaInstall.js.
import './src/utils/pwaInstall';
import React, { useEffect, useState, lazy, Suspense } from 'react';
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
import { MASTER_IDS as MASTER_COACH_IDS } from './src/constants/masterIds';

const InstallScreen = lazy(() => import('./src/screens/InstallScreen'));
const LoginScreen = lazy(() => import('./src/screens/LoginScreen'));
const RegisterScreen = lazy(() => import('./src/screens/RegisterScreen'));
const AnamneseScreen = lazy(() => import('./src/screens/AnamneseScreen'));
const AnamneseVIPScreen = lazy(() => import('./src/screens/AnamneseVIPScreen'));
const SetupTreinoScreen = lazy(() => import('./src/screens/SetupTreinoScreen'));
const PropostaScreen = lazy(() => import('./src/screens/PropostaScreen'));
const PropostaStartScreen = lazy(() => import('./src/screens/PropostaStartScreen'));
const PropostaMaesScreen = lazy(() => import('./src/screens/PropostaMaesScreen'));
const PropostaNavegantesScreen = lazy(() => import('./src/screens/PropostaNavegantesScreen'));
const PropostaFamiliaScreen = lazy(() => import('./src/screens/PropostaFamiliaScreen'));
const SaaSPropostaScreen = lazy(() => import('./src/screens/SaaSPropostaScreen'));
const DesafioInscricaoScreen = lazy(() => import('./src/screens/DesafioInscricaoScreen'));
const DesafioCheckinScreen = lazy(() => import('./src/screens/DesafioCheckinScreen'));
const HomeScreen = lazy(() => import('./src/screens/HomeScreen'));
const TrainingScreen = lazy(() => import('./src/screens/TrainingScreen'));
const EvolutionScreen = lazy(() => import('./src/screens/EvolutionScreen'));
const ProfileScreen = lazy(() => import('./src/screens/ProfileScreen'));
const CheckInScreen = lazy(() => import('./src/screens/CheckInScreen'));
const UserHistoryScreen = lazy(() => import('./src/screens/UserHistoryScreen'));
const PAFlixScreen = lazy(() => import('./src/screens/PAFlixScreen'));
const BibliotecaScreen = lazy(() => import('./src/screens/BibliotecaScreen'));
const PDFViewerScreen = lazy(() => import('./src/screens/PDFViewerScreen'));
const VideoPlayerScreen = lazy(() => import('./src/screens/VideoPlayerScreen'));
const AudioPlayerScreen = lazy(() => import('./src/screens/AudioPlayerScreen'));
const DietScreen = lazy(() => import('./src/screens/DietScreen'));
const RoutineDetailsScreen = lazy(() => import('./src/screens/RoutineDetailsScreen'));
const DayWorkoutScreen = lazy(() => import('./src/screens/DayWorkoutScreen'));
const FinishScreen = lazy(() => import('./src/screens/FinishScreen'));
const AdminDashboard = lazy(() => import('./src/screens/AdminDashboard'));
const MontarTreinoAdmin = lazy(() => import('./src/screens/MontarTreinoAdmin'));
const BibliotecaAdmin = lazy(() => import('./src/screens/BibliotecaAdmin'));
const GerenciarTemplates = lazy(() => import('./src/screens/GerenciarTemplates'));
const AdminUserOptions = lazy(() => import('./src/screens/AdminUserOptions'));
const AdminEvolutionScreen = lazy(() => import('./src/screens/AdminEvolutionScreen'));
const AdminAddContent = lazy(() => import('./src/screens/AdminAddContent'));
const AdminStudentCheckinsScreen = lazy(() => import('./src/screens/AdminStudentCheckinsScreen'));
const AdminIALabScreen = lazy(() => import('./src/screens/AdminIALabScreen'));
const AdminDietScreen = lazy(() => import('./src/screens/AdminDietScreen'));
const AdminDietLibraryScreen = lazy(() => import('./src/screens/AdminDietLibraryScreen'));
const AIScannerModal = lazy(() => import('./src/components/AIScannerModal'));
const LaboratoryScreen = lazy(() => import('./src/screens/LaboratoryScreen'));
const LaboratoryBuilderScreen = lazy(() => import('./src/screens/LaboratoryBuilderScreen'));
const LaboratoryFinalScreen = lazy(() => import('./src/screens/LaboratoryFinalScreen'));
const GerarTreinoIA = lazy(() => import('./src/screens/GerarTreinoIA'));
const AdminTechniquesScreen = lazy(() => import('./src/screens/AdminTechniquesScreen'));
const ResetPasswordScreen = lazy(() => import('./src/screens/ResetPasswordScreen'));
const AdminFoodManagerScreen = lazy(() => import('./src/screens/AdminFoodManagerScreen'));
const AdminSubstitutionGroupsScreen = lazy(() => import('./src/screens/AdminSubstitutionGroupsScreen'));
const AdminSubstitutionGroupDetailScreen = lazy(() => import('./src/screens/AdminSubstitutionGroupDetailScreen'));
const AdminCoachesScreen = lazy(() => import('./src/screens/AdminCoachesScreen'));
const AdminAnamneseBuilderScreen = lazy(() => import('./src/screens/AdminAnamneseBuilderScreen'));
const CoachBlockedScreen = lazy(() => import('./src/screens/CoachBlockedScreen'));
const CoachPropostaScreen = lazy(() => import('./src/screens/CoachPropostaScreen'));
// 🔥 ESTRATÉGIAS
const AdminStrategiesScreen = lazy(() => import('./src/screens/AdminStrategiesScreen'));

// 🔥 PERFORMANCE: telas carregadas sob demanda (code splitting) em vez de tudo no bundle inicial.
// Cada tela só é baixada/executada na primeira vez que o usuário navega até ela.
function ScreenLoadingFallback() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme?.bg || '#000', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={theme?.accent || '#CCFF00'} />
    </View>
  );
}

function withLazySuspense(LazyComponent) {
  return function LazyScreenWrapper(props) {
    return (
      <Suspense fallback={<ScreenLoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') return null;
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;
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
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${u.id}?t=${Date.now()}&omit=diets,workouts,anamneses`);
          if (res.ok) {
            const fresh = await res.json();
            setUserData(fresh);
            // 🔥 LIPOASPIRAÇÃO DE MEMÓRIA: Remove os arrays gigantes antes de salvar no celular
            const { diets, workouts, anamneses, ...leanFresh } = fresh;
            AsyncStorage.setItem('user', JSON.stringify(leanFresh)).catch(() => {});
          }
        } catch (e) {
          console.log('Erro refresh user', e);
        }
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

  const belongsToMaster =
    !userData?.coachId ||
    MASTER_COACH_IDS.includes(userData?.coachId) ||
    MASTER_COACH_IDS.includes(userData?.nutritionistId);

  const isElite = userData?.plan === 'ELITE' || userData?.plan === 'VIP';

  const showDiet =
    (belongsToMaster && (userData?.dietModule === true || isElite)) ||
    userData?.studentModules === 'DIETA' ||
    userData?.studentModules === 'AMBOS';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopColor: theme.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
      }}
    >
      <Tab.Screen name="Início" children={withLazySuspense(HomeScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" size={size} color={color} /> }} />
      <Tab.Screen name="Treinos" children={withLazySuspense(TrainingScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" size={size} color={color} /> }} />
      {showDiet && (
        <Tab.Screen name="Dieta" children={withLazySuspense(DietScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="food-apple" size={size} color={color} /> }} />
      )}
      <Tab.Screen name="Biblioteca" children={withLazySuspense(BibliotecaScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="play-box-multiple" size={size} color={color} /> }} />
      <Tab.Screen name="Evolução" children={withLazySuspense(EvolutionScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" size={size} color={color} /> }} />
      <Tab.Screen name="Perfil" children={withLazySuspense(ProfileScreen)} initialParams={{ userData }} options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} /> }} />
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
          const finalRole = role || user.role || user.type || 'ALUNO';
          setSavedUser(user);
          if (finalRole.toLowerCase() === 'admin' || finalRole.toLowerCase() === 'coach') {
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
      <Stack.Screen name="Install" children={withLazySuspense(InstallScreen)} />
      <Stack.Screen name="Login" children={withLazySuspense(LoginScreen)} />
      <Stack.Screen name="Register" children={withLazySuspense(RegisterScreen)} />
      <Stack.Screen name="RedefinirSenha" children={withLazySuspense(ResetPasswordScreen)} />
      <Stack.Screen name="Anamnese" children={withLazySuspense(AnamneseScreen)} options={{ headerShown: false, tabBarVisible: false }} />
      <Stack.Screen name="AnamneseVIP" children={withLazySuspense(AnamneseVIPScreen)} />
      <Stack.Screen name="SetupTreino" children={withLazySuspense(SetupTreinoScreen)} />
      <Stack.Screen name="Proposta" children={withLazySuspense(PropostaScreen)} />
      <Stack.Screen name="PropostaStart" children={withLazySuspense(PropostaStartScreen)} />
      <Stack.Screen name="PropostaMaes" children={withLazySuspense(PropostaMaesScreen)} />
      <Stack.Screen name="PropostaNavegantes" children={withLazySuspense(PropostaNavegantesScreen)} />
      <Stack.Screen name="PropostaFamilia" children={withLazySuspense(PropostaFamiliaScreen)} />
      <Stack.Screen name="SaaSProposta" children={withLazySuspense(SaaSPropostaScreen)} />
      <Stack.Screen name="CoachProposta" children={withLazySuspense(CoachPropostaScreen)} />
      <Stack.Screen name="DesafioInscricao" children={withLazySuspense(DesafioInscricaoScreen)} />
      <Stack.Screen name="DesafioCheckin" children={withLazySuspense(DesafioCheckinScreen)} />
      <Stack.Screen name="Main" component={StudentTabs} initialParams={{ userData: savedUser }} />
      <Stack.Screen name="RoutineDetails" children={withLazySuspense(RoutineDetailsScreen)} />
      <Stack.Screen name="DayWorkoutScreen" children={withLazySuspense(DayWorkoutScreen)} />
      <Stack.Screen name="DayWorkout" children={withLazySuspense(DayWorkoutScreen)} />
      <Stack.Screen name="FinishScreen" children={withLazySuspense(FinishScreen)} />
      <Stack.Screen name="CheckIn" children={withLazySuspense(CheckInScreen)} />
      <Stack.Screen name="UserHistory" children={withLazySuspense(UserHistoryScreen)} />
      <Stack.Screen name="ScannerIA" children={withLazySuspense(AIScannerModal)} />
      <Stack.Screen name="Biblioteca" children={withLazySuspense(BibliotecaScreen)} />
      <Stack.Screen name="PDFViewer" children={withLazySuspense(PDFViewerScreen)} />
      <Stack.Screen name="VideoPlayer" children={withLazySuspense(VideoPlayerScreen)} />
      <Stack.Screen name="AudioPlayer" children={withLazySuspense(AudioPlayerScreen)} />
      <Stack.Screen name="PAFlix" children={withLazySuspense(PAFlixScreen)} />
      <Stack.Screen name="AdminDashboard" children={withLazySuspense(AdminDashboard)} />
      <Stack.Screen name="MontarTreinoAdmin" children={withLazySuspense(MontarTreinoAdmin)} />
      <Stack.Screen name="BibliotecaAdmin" children={withLazySuspense(BibliotecaAdmin)} />
      <Stack.Screen name="GerenciarTemplates" children={withLazySuspense(GerenciarTemplates)} />
      <Stack.Screen name="AdminAlunoOptions" children={withLazySuspense(AdminUserOptions)} />
      <Stack.Screen name="AdminEvolution" children={withLazySuspense(AdminEvolutionScreen)} />
      <Stack.Screen name="AdminAddContent" children={withLazySuspense(AdminAddContent)} />
      <Stack.Screen name="AdminStudentCheckins" children={withLazySuspense(AdminStudentCheckinsScreen)} />
      <Stack.Screen name="AdminIALabScreen" children={withLazySuspense(AdminIALabScreen)} />
      <Stack.Screen name="AdminDietScreen" children={withLazySuspense(AdminDietScreen)} />
      <Stack.Screen name="AdminDietLibraryScreen" children={withLazySuspense(AdminDietLibraryScreen)} />
      <Stack.Screen name="LaboratoryScreen" children={withLazySuspense(LaboratoryScreen)} />
      <Stack.Screen name="LaboratoryBuilderScreen" children={withLazySuspense(LaboratoryBuilderScreen)} />
      <Stack.Screen name="LaboratoryFinalScreen" children={withLazySuspense(LaboratoryFinalScreen)} />
      <Stack.Screen name="GerarTreinoIA" children={withLazySuspense(GerarTreinoIA)} options={{ headerShown: false }} />
      <Stack.Screen name="AdminTechniquesScreen" children={withLazySuspense(AdminTechniquesScreen)} />
      <Stack.Screen name="AdminFoodManagerScreen" children={withLazySuspense(AdminFoodManagerScreen)} />
      <Stack.Screen name="AdminSubstitutionGroupsScreen" children={withLazySuspense(AdminSubstitutionGroupsScreen)} />
      <Stack.Screen name="AdminSubstitutionGroupDetailScreen" children={withLazySuspense(AdminSubstitutionGroupDetailScreen)} />
      <Stack.Screen name="AdminCoachesScreen" children={withLazySuspense(AdminCoachesScreen)} />
      <Stack.Screen name="AdminAnamneseBuilderScreen" children={withLazySuspense(AdminAnamneseBuilderScreen)} />
      <Stack.Screen name="CoachBlockedScreen" children={withLazySuspense(CoachBlockedScreen)} />
      <Stack.Screen name="CoachPropostaScreen" children={withLazySuspense(CoachPropostaScreen)} />
      {/* 🔥 ESTRATÉGIAS */}
      <Stack.Screen name="AdminStrategiesScreen" children={withLazySuspense(AdminStrategiesScreen)} />
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: [
    'https://www.pauloadrianoteam.com.br',
    'https://pauloadrianoteam.com.br',
    'http://localhost:8081',
    'http://localhost:8082',
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
      CoachProposta: { path: 'seja-coach' },
      DesafioInscricao: { path: 'Desafio' },
      DesafioCheckin: { path: 'CheckinDesafio' },
      SaaSProposta: {
        path: 'invite/:coachId',
        parse: { coachId: (v) => String(v) },
        stringify: { coachId: (v) => v },
      },
      RedefinirSenha: {
        path: 'redefinir-senha',
        parse: { token: (v) => String(v) },
        stringify: { token: (v) => v },
      },
      AdminDashboard: { path: 'admin' },
      AdminStudentCheckins: {
        path: 'admin-checkins',
        parse: { alunoId: (v) => String(v), alunoName: (v) => decodeURIComponent(v) },
        stringify: { alunoId: (v) => v, alunoName: (v) => encodeURIComponent(v) },
      },
      AdminEvolution: {
        path: 'admin-evolution',
        parse: { alunoId: (v) => String(v), alunoName: (v) => decodeURIComponent(v) },
        stringify: { alunoId: (v) => v, alunoName: (v) => encodeURIComponent(v) },
      },
      AdminAlunoOptions: {
        path: 'admin-aluno',
        parse: { alunoId: (v) => String(v) },
        stringify: { alunoId: (v) => v },
      },
    },
  },
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