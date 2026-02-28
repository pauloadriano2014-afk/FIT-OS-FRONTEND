import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Configuração Padrão (Fundo Preto + Verde)
  const [theme, setTheme] = useState({
    isDark: true,
    bg: '#000000',
    surface: '#111111',
    text: '#FFFFFF',
    textSecondary: '#666666',
    border: '#222222',
    accent: '#CCFF00'
  });

  const [loadingTheme, setLoadingTheme] = useState(true);

  // Paleta de Cores Mapeada
  const lightColors = {
    verde: '#99CC00', // Um pouco mais escuro para dar leitura no branco
    rosa: '#FF2D55',
    roxo: '#AF52DE',
    azul: '#007AFF',
    vermelho: '#FF3B30'
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme) {
        setTheme(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.log("Erro ao carregar tema", error);
    } finally {
      setLoadingTheme(false);
    }
  };

  // Função que as telas vão chamar para trocar a cor
  const changeTheme = async (isDark, colorKey = 'verde') => {
    let newTheme = {};

    if (isDark) {
      newTheme = {
        isDark: true,
        bg: '#000000',
        surface: '#111111',
        text: '#FFFFFF',
        textSecondary: '#666666',
        border: '#222222',
        accent: '#CCFF00' // O Verde Neon original
      };
    } else {
      newTheme = {
        isDark: false,
        bg: '#F5F5F7', // Fundo cinza beeeem clarinho padrão Apple
        surface: '#FFFFFF', // Cards brancos
        text: '#000000',
        textSecondary: '#888888',
        border: '#E5E5EA',
        accent: lightColors[colorKey] || lightColors.verde
      };
    }

    setTheme(newTheme);
    await AsyncStorage.setItem('app_theme', JSON.stringify(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, loadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);