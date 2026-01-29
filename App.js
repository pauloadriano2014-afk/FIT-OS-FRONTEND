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

// Telas de Autenticação e Onboarding
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AnamneseScreen from './src/screens/AnamneseScreen'; 
import AnamneseVIPScreen from './src/screens/AnamneseVIPScreen';

// Telas Principais do Aluno
import HomeScreen from './src/screens/HomeScreen';
import TrainingScreen from './src/screens/TrainingScreen'; 
import EvolutionScreen from './src/screens/EvolutionScreen'; 
import ProfileScreen from './src/screens/ProfileScreen'; 
import CheckInScreen from './src/screens/CheckInScreen'; 
import UserHistoryScreen from './src/screens/UserHistoryScreen'; 

// PA FLIX
import PAFlixScreen from './src/screens/PAFlixScreen';

// Novas Telas de Treino e Finalização
import RoutineDetailsScreen from './src/screens/RoutineDetailsScreen'; 
import DayWorkoutScreen from './src/screens/DayWorkoutScreen'; 
import FinishScreen from './src/screens/FinishScreen';

// Telas do Admin
import AdminDashboard from './src/screens/AdminDashboard'; 
import MontarTreinoAdmin from './src/screens/MontarTreinoAdmin'; 
import BibliotecaAdmin from './src/screens/BibliotecaAdmin'; 
import GerenciarTemplates from './src/screens/GerenciarTemplates';
import AdminUserOptions from './src/screens/AdminUserOptions'; 
import AdminEvolutionScreen from './src/screens/AdminEvolutionScreen'; 
import AdminAddContent from './src/screens/AdminAddContent';

// Componentes Globais
import AIScannerModal from './src/components/AIScannerModal'; 

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
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#CCFF00',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'SEU_PROJECT_ID_AQUI' 
    })).data;
  }
  return token;
}

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator({ route }) {
  const userData = route.params?.userData;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const tabHeight = isWeb ? 80 : (60 + (insets.bottom > 0 ? insets.bottom : 10));
  const paddingBot = isWeb ? 10 : (insets.bottom > 0 ? insets.bottom : 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#080808', 
          borderTopWidth: 1, 
          borderTopColor: '#1A1A1A', 
          height: tabHeight, 
          paddingBottom: paddingBot, 
          paddingTop: 10 
        },
        tabBarActiveTintColor: '#CCFF00',
        tabBarInactiveTintColor: '#555',
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Início') iconName = 'home';
          else if (route.name === 'Treinos') iconName = 'dumbbell';
          else if (route.name === 'PA FLIX') iconName = 'play-circle-outline'; 
          else if (route.name === 'Evolução') iconName = 'chart-line';
          else if (route.name === 'Perfil') iconName = 'account';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
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

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [savedUser, setSavedUser] = useState(null);

  // 🕵️‍♂️ VERIFICA SE O USUÁRIO JÁ EXISTE NO DISCO
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          setSavedUser(user);
          
          // Se for admin, manda pro dashboard, se não, pra Main
          if (user.isAdmin) {
             setInitialRoute('AdminDashboard');
          } else {
             setInitialRoute('Main');
          }
          console.log("🔄 Sessão restaurada para:", user.email);
        }
      } catch (e) {
        console.log("Erro ao restaurar sessão:", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, []);

  // Configuração de Push (Mantida)
  useEffect(() => {
    if (!isLoading && savedUser) {
        registerForPushNotificationsAsync().then(async (token) => {
            if (token) {
                try {
                    await fetch('https://fitos-final.onrender.com/api/user/push-token', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ userId: savedUser.id, token: token })
                    });
                } catch(e) { console.log("Erro token", e); }
            }
        });
    }
  }, [isLoading, savedUser]);

  // TELA DE LOADING ENQUANTO VERIFICA O LOGIN
  if (isLoading) {
    return (
      <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#CCFF00" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} /> 
          <Stack.Screen name="Anamnese" component={AnamneseScreen} />
          <Stack.Screen name="AnamneseVIP" component={AnamneseVIPScreen} /> 
          
          {/* 🔥 AQUI ESTÁ A MÁGICA: Passamos o savedUser se ele existir */}
          <Stack.Screen 
            name="Main" 
            component={TabNavigator} 
            initialParams={savedUser ? { userData: savedUser } : undefined} 
          />
          
          <Stack.Screen name="RoutineDetails" component={RoutineDetailsScreen} />
          <Stack.Screen name="DayWorkout" component={DayWorkoutScreen} />
          <Stack.Screen name="FinishScreen" component={FinishScreen} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} />
          <Stack.Screen name="ScannerIA" component={AIScannerModal} />
          <Stack.Screen name="UserHistory" component={UserHistoryScreen} />
          
          {/* ROTAS ADMIN */}
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="MontarTreinoAdmin" component={MontarTreinoAdmin} />
          <Stack.Screen name="BibliotecaAdmin" component={BibliotecaAdmin} /> 
          <Stack.Screen name="GerenciarTemplates" component={GerenciarTemplates} />
          <Stack.Screen name="AdminAlunoOptions" component={AdminUserOptions} />
          <Stack.Screen name="AdminEvolution" component={AdminEvolutionScreen} /> 
          <Stack.Screen name="AdminAddContent" component={AdminAddContent} /> 
          <Stack.Screen name="Evolution" component={EvolutionScreen} /> 
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}