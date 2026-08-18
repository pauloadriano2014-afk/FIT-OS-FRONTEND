// src/components/InstallAppButton.js
//
// 🔥 BOTÃO MANUAL DE INSTALAÇÃO DO PWA (fica em Perfil)
//
// A InstallScreen (tela inicial) só aparece UMA vez — depois que o aluno
// toca em "já instalei ou prefiro usar no navegador" (ou instala de
// verdade), isso fica salvo pra sempre no navegador e ela nunca mais
// aparece, nem depois de deslogar/logar de novo no mesmo aparelho. Se o
// aluno pulou sem instalar de propósito, ou o navegador não ofereceu o
// prompt automático a tempo, não sobrava nenhum jeito de tentar de novo.
//
// Esse componente cobre esse buraco: fica sempre acessível em Perfil,
// some sozinho se o app já estiver instalado, e tenta o prompt nativo do
// navegador primeiro — só cai pro passo a passo manual se o navegador não
// tiver esse prompt disponível (sempre o caso no iOS/Safari).

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  tryNativeInstallPrompt,
  getInstallPrompt,
  isStandalone,
  getPlatformInstallInfo,
} from '../utils/pwaInstall';

export default function InstallAppButton({ theme }) {
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platformInfo, setPlatformInfo] = useState({ isIOS: false, isChromeIOS: false });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Só mostra se ainda estiver rodando dentro do navegador (não instalado).
    setVisible(!isStandalone());
    setPlatformInfo(getPlatformInstallInfo());
  }, []);

  if (!visible) return null;

  const handlePress = async () => {
    if (getInstallPrompt()) {
      const accepted = await tryNativeInstallPrompt();
      if (accepted) {
        setVisible(false);
        return;
      }
    }
    // Sem prompt nativo disponível (iOS, ou Android que não ofereceu dessa
    // vez) — abre/fecha o passo a passo manual.
    setShowInstructions((prev) => !prev);
  };

  const { isIOS, isChromeIOS } = platformInfo;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity style={styles.row} onPress={handlePress} activeOpacity={0.7}>
        <View style={styles.rowLeft}>
          <MaterialCommunityIcons name="cellphone-arrow-down" size={22} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Instalar aplicativo</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Acesso rápido direto na tela inicial do seu celular
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={showInstructions ? 'chevron-up' : 'chevron-right'}
          size={22}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {showInstructions && (
        <View style={[styles.instructionBox, { borderTopColor: theme.border }]}>
          {isIOS ? (
            isChromeIOS ? (
              <Text style={[styles.instructionText, { color: theme.text }]}>
                1. Toque em Compartilhar no topo.{'\n'}
                2. Vá em "Ver mais".{'\n'}
                3. Selecione "Adicionar à Tela de Início".
              </Text>
            ) : (
              <Text style={[styles.instructionText, { color: theme.text }]}>
                1. Toque no botão de Compartilhar na barra inferior.{'\n'}
                2. Role para baixo e selecione "Adicionar à Tela de Início".
              </Text>
            )
          ) : (
            <Text style={[styles.instructionText, { color: theme.text }]}>
              1. Clique nos 3 pontinhos do navegador (menu, geralmente no
              canto superior direito).{'\n'}
              2. Selecione "Instalar Aplicativo" ou "Adicionar à Tela Inicial".
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 10 },
  title: { fontSize: 15, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  instructionBox: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 15, borderTopWidth: 1 },
  instructionText: { fontSize: 13, lineHeight: 24, fontWeight: '600' },
});
