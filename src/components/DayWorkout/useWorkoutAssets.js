// src/components/DayWorkout/useWorkoutAssets.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FileSystem e NetInfo são nativos — importados condicionalmente
let FileSystem = null;
let NetInfo = null;

if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  NetInfo = require('@react-native-community/netinfo').default;
}

const ASSETS_DIR = FileSystem ? `${FileSystem.documentDirectory}workout_assets/` : null;
const MAP_KEY = '@workout_asset_map';
const INDEX_KEY = '@workout_asset_index';

// Cofre de segurança para os downloads via PWA (Web)
const WEB_CACHE_NAME = 'trainer-os-offline-v1';

const isYouTube = (url) =>
  !url ? true : url.includes('youtube.com') || url.includes('youtu.be') || url.includes('cloudflarestream.com');

const uriToFilename = (uri) => {
  const clean = uri.split('?')[0];
  const ext = clean.split('.').pop().toLowerCase().substring(0, 4) || 'bin';
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i);
    hash |= 0;
  }
  return `${Math.abs(hash)}.${ext}`;
};

const ensureDir = async () => {
  if (!FileSystem) return;
  const info = await FileSystem.getInfoAsync(ASSETS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ASSETS_DIR, { intermediates: true });
};

export default function useWorkoutAssets(exercises, workoutId, day) {
  // Referências para App Nativo
  const mapRef = useRef({});
  const indexRef = useRef({});
  // Referência para App PWA (Links locais do Cache)
  const webBlobMap = useRef({});

  const isDownloading = useRef(false);

  // 'idle' | 'downloading' | 'done' | 'error'
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const workoutKey = `${workoutId}_${day}`;

  const collectUris = useCallback(() => {
    const uris = [];
    (exercises || []).forEach((item) => {
      const thumb =
        item.exercise?.thumbUrl || item.thumbUrl ||
        item.exercise?.imageUrl || item.imageUrl ||
        item.exercise?.image || item.image ||
        item.exercise?.gifUrl || item.gifUrl ||
        item.exercise?.thumbnailUrl;
      if (thumb) uris.push(thumb);

      const video = item.exercise?.videoUrl || item.videoUrl;
      if (video && !isYouTube(video)) uris.push(video);
    });
    return [...new Set(uris)];
  }, [exercises]);

  // Checa se os arquivos já estão baixados ao abrir a tela
  useEffect(() => {
    const load = async () => {
      if (Platform.OS === 'web') {
        // Lógica PWA
        if (!('caches' in window)) return;
        try {
          const cache = await caches.open(WEB_CACHE_NAME);
          const uris = collectUris();
          if (uris.length === 0) return;

          let cachedCount = 0;
          const newBlobMap = {};

          for (let uri of uris) {
            const response = await cache.match(uri);
            if (response) {
              cachedCount++;
              const blob = await response.blob();
              newBlobMap[uri] = URL.createObjectURL(blob);
            }
          }
          webBlobMap.current = newBlobMap;

          if (cachedCount === uris.length && uris.length > 0) {
            setDownloadStatus('done');
          } else {
            setDownloadStatus('idle');
          }
        } catch (e) {
          console.error("Erro no carregamento do Cache PWA:", e);
        }
      } else {
        // Lógica Nativa
        try {
          const [rawMap, rawIndex] = await Promise.all([
            AsyncStorage.getItem(MAP_KEY),
            AsyncStorage.getItem(INDEX_KEY),
          ]);
          if (rawMap) mapRef.current = JSON.parse(rawMap);
          if (rawIndex) indexRef.current = JSON.parse(rawIndex);

          const uris = indexRef.current[workoutKey] || [];
          if (uris.length > 0) {
            const checks = await Promise.all(
              uris.map(async (uri) => {
                const local = mapRef.current[uri];
                if (!local) return false;
                const info = await FileSystem.getInfoAsync(local);
                return info.exists;
              })
            );
            if (checks.every(Boolean)) setDownloadStatus('done');
          }
        } catch (e) {}
      }
    };
    load();
  }, [workoutKey, collectUris]);

  const persistMap = async () => AsyncStorage.setItem(MAP_KEY, JSON.stringify(mapRef.current));
  const persistIndex = async () => AsyncStorage.setItem(INDEX_KEY, JSON.stringify(indexRef.current));

  const startDownload = useCallback(async () => {
    if (isDownloading.current) return { success: false, reason: 'already_downloading' };

    isDownloading.current = true;
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    const uris = collectUris();

    if (uris.length === 0) {
      setDownloadStatus('done');
      isDownloading.current = false;
      return { success: true };
    }

    try {
      if (Platform.OS === 'web') {
        // Lógica de Download PWA
        if (!('caches' in window)) throw new Error('Navegador não suporta modo offline.');
        const cache = await caches.open(WEB_CACHE_NAME);
        let downloaded = 0;

        for (let uri of uris) {
          const existing = await cache.match(uri);
          if (!existing) {
            const response = await fetch(uri);
            if (response.ok) await cache.put(uri, response.clone());
          }
          downloaded++;
          setDownloadProgress(Math.round((downloaded / uris.length) * 100));
        }

        // Gera os links seguros locais (Blobs) para rodar liso no modo avião
        const newBlobMap = { ...webBlobMap.current };
        for (let uri of uris) {
          const response = await cache.match(uri);
          if (response && !newBlobMap[uri]) {
            const blob = await response.blob();
            newBlobMap[uri] = URL.createObjectURL(blob);
          }
        }
        webBlobMap.current = newBlobMap;

        setDownloadStatus('done');
        return { success: true };

      } else {
        // Lógica de Download Nativa
        if (NetInfo) {
          const netState = await NetInfo.fetch();
          if (!netState.isConnected) throw new Error('Sem internet');
        }

        await ensureDir();
        const downloadedUris = [];

        for (let i = 0; i < uris.length; i++) {
          const uri = uris[i];

          // Já em disco
          if (mapRef.current[uri]) {
            const info = await FileSystem.getInfoAsync(mapRef.current[uri]);
            if (info.exists) {
              downloadedUris.push(uri);
              setDownloadProgress(Math.round(((i + 1) / uris.length) * 100));
              continue;
            }
          }

          try {
            const filename = uriToFilename(uri);
            const localPath = `${ASSETS_DIR}${filename}`;
            const result = await FileSystem.downloadAsync(uri, localPath);
            if (result.status === 200) {
              mapRef.current[uri] = localPath;
              downloadedUris.push(uri);
            }
          } catch (e) {}

          setDownloadProgress(Math.round(((i + 1) / uris.length) * 100));
        }

        indexRef.current[workoutKey] = downloadedUris;
        await Promise.all([persistMap(), persistIndex()]);

        setDownloadStatus('done');
        return { success: true };
      }
    } catch (e) {
      console.error(e);
      setDownloadStatus('error');
      return { success: false, reason: 'error' };
    } finally {
      isDownloading.current = false;
    }
  }, [collectUris, workoutKey]);

  const deleteDownload = useCallback(async () => {
    try {
      const uris = collectUris();
      
      if (Platform.OS === 'web') {
        // Lógica de Deleção PWA
        if (!('caches' in window)) return;
        const cache = await caches.open(WEB_CACHE_NAME);
        for (let uri of uris) {
          await cache.delete(uri);
          if (webBlobMap.current[uri]) {
            URL.revokeObjectURL(webBlobMap.current[uri]); // Limpa memória do navegador
            delete webBlobMap.current[uri];
          }
        }
      } else {
        // Lógica de Deleção Nativa
        const cachedUris = indexRef.current[workoutKey] || [];
        await Promise.all(
          cachedUris.map(async (uri) => {
            const local = mapRef.current[uri];
            if (local) {
              try {
                const info = await FileSystem.getInfoAsync(local);
                if (info.exists) await FileSystem.deleteAsync(local, { idempotent: true });
              } catch (e) {}
              delete mapRef.current[uri];
            }
          })
        );
        delete indexRef.current[workoutKey];
        await Promise.all([persistMap(), persistIndex()]);
      }
      
      setDownloadStatus('idle');
      setDownloadProgress(0);
    } catch (e) {}
  }, [collectUris, workoutKey]);

  // Função que entrega o vídeo para a tela: se já baixou, manda o caminho offline!
  const resolveAsset = useCallback((uri) => {
    if (!uri) return null;
    if (Platform.OS === 'web') {
      return webBlobMap.current[uri] || uri; 
    }
    return mapRef.current[uri] || uri;
  }, []);

  return {
    resolveAsset,
    downloadStatus,   // 'idle' | 'downloading' | 'done' | 'error'
    downloadProgress,
    startDownload,
    deleteDownload,
  };
}