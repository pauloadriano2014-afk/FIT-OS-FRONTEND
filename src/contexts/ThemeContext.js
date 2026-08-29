import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

const STORAGE_KEY = 'app_theme';

// Configuração Padrão (Fundo Preto + Verde)
const DARK_THEME = {
  isDark: true,
  bg: '#000000',
  surface: '#111111',
  text: '#FFFFFF',
  textSecondary: '#666666',
  border: '#222222',
  accent: '#CCFF00',
  colorKey: 'verde', // 🔥 guarda junto qual cor foi a última escolhida no modo claro
};

// Paleta de Cores Mapeada (modo claro)
const LIGHT_COLORS = {
  verde: '#99CC00', // Um pouco mais escuro para dar leitura no branco
  rosa: '#FF2D55',
  roxo: '#AF52DE',
  azul: '#007AFF',
  vermelho: '#FF3B30',
};

// 🔥 No web, lê o tema salvo de forma SÍNCRONA direto do localStorage já no
// valor inicial do estado (em vez de esperar o AsyncStorage, que é
// assíncrono) — isso evita tanto o "flash" de tema escuro por uma fração de
// segundo até o load resolver quanto qualquer instabilidade do wrapper do
// AsyncStorage nesse ambiente. No nativo (iOS/Android) mantém o fluxo
// assíncrono normal via loadTheme().
function getInitialTheme() {
  if (Platform.OS === 'web') {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (saved) return { ...DARK_THEME, ...JSON.parse(saved) };
    } catch (error) {
      console.log('Erro ao ler tema salvo (web)', error);
    }
  }
  return DARK_THEME;
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  // No web o tema já vem pronto no valor inicial acima — não tem o que "carregar".
  const [loadingTheme, setLoadingTheme] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return; // já resolvido de forma síncrona
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedTheme) setTheme({ ...DARK_THEME, ...JSON.parse(savedTheme) });
    } catch (error) {
      console.log("Erro ao carregar tema", error);
    } finally {
      setLoadingTheme(false);
    }
  };

  const persistTheme = async (newTheme) => {
    const json = JSON.stringify(newTheme);
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, json);
      } catch (error) {
        console.log('Erro ao salvar tema (web)', error);
      }
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
      console.log('Erro ao salvar tema', error);
    }
  };

  // Função que as telas vão chamar para trocar a cor
  const changeTheme = async (isDark, colorKey = 'verde') => {
    let newTheme;

    if (isDark) {
      newTheme = { ...DARK_THEME };
    } else {
      const key = LIGHT_COLORS[colorKey] ? colorKey : 'verde';
      newTheme = {
        isDark: false,
        bg: '#F5F5F7', // Fundo cinza beeeem clarinho padrão Apple
        surface: '#FFFFFF', // Cards brancos
        text: '#000000',
        textSecondary: '#888888',
        border: '#E5E5EA',
        accent: LIGHT_COLORS[key],
        colorKey: key,
      };
    }

    setTheme(newTheme);
    await persistTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, loadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
