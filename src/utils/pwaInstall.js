// src/utils/pwaInstall.js
//
// 🔥 MÓDULO EAGER (import ESTÁTICO, nunca lazy) — registra o listener do
// `beforeinstallprompt` assim que o app carrega, antes de qualquer tela
// ser desenhada. Isso é crítico: o navegador dispara esse evento só UMA
// vez por carregamento de página, e se não existir um listener já
// registrado nesse exato momento, o evento se perde pra sempre (não dá
// pra "recuperar" depois).
//
// Antes esse listener vivia direto dentro do InstallScreen.js. Só que
// depois que as telas passaram a ser carregadas com React.lazy() (pra
// diminuir o bundle inicial), o arquivo da tela só é importado — e o
// listener só é registrado — quando a tela realmente é renderizada pela
// primeira vez. Isso pode ser tarde demais pra pegar o evento automático
// do Android, o que ajuda a explicar o "às vezes não instala de primeira".
//
// Por isso o listener agora mora aqui, num módulo importado de forma
// estática lá no topo do App.js (fora de qualquer lazy()), garantindo que
// ele já está de pé antes do navegador disparar o evento.

import { Platform } from 'react-native';

let deferredPrompt = null;
let justInstalled = false;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    justInstalled = true;
    deferredPrompt = null;
  });
}

// Retorna o evento nativo de instalação capturado, se o navegador já tiver
// disparado ele nessa sessão de página (Chrome/Edge/Android). Fica `null`
// no iOS (Safari nunca dispara isso) e às vezes também no Android, se o
// navegador decidiu não oferecer o prompt automático dessa vez.
export function getInstallPrompt() {
  return deferredPrompt;
}

export function clearInstallPrompt() {
  deferredPrompt = null;
}

export function wasJustInstalled() {
  return justInstalled;
}

// O app já está instalado e rodando "standalone" (fora do navegador)?
export function isStandalone() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch (e) {
    return false;
  }
}

// iOS nunca dispara beforeinstallprompt — sempre precisa mostrar o passo a
// passo manual (Compartilhar > Adicionar à Tela de Início).
export function getPlatformInstallInfo() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { isIOS: false, isChromeIOS: false };
  }
  const ua = window.navigator.userAgent.toLowerCase();
  return {
    isIOS: /iphone|ipad|ipod/.test(ua),
    isChromeIOS: ua.includes('crios'),
  };
}

// Tenta abrir o prompt nativo de instalação do navegador (só funciona se
// `getInstallPrompt()` já tiver algo capturado). Retorna `true` se o
// usuário aceitou instalar.
export async function tryNativeInstallPrompt() {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}
