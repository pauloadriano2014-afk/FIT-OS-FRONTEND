// src/components/DayWorkout/useWorkoutAssets.js
//
// Responsabilidade:
//   - Baixar e cachear em disco thumbs + vídeos R2 do treino sob demanda
//   - Expor progresso do download para exibir na UI
//   - Permitir exclusão dos assets de um treino específico
//   - resolveAsset(uri) → path local se existir, uri original se não

import { useState, useEffect, useRef, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const ASSETS_DIR = `${FileSystem.documentDirectory}workout_assets/`;
const MAP_KEY = '@workout_asset_map'; // mapa global uri → localPath
const INDEX_KEY = '@workout_asset_index'; // índice workoutId_day → [uri, uri, ...]

// Vídeos YouTube/Stream nunca são baixados
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
  const info = await FileSystem.getInfoAsync(ASSETS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(ASSETS_DIR, { intermediates: true });
};

export default function useWorkoutAssets(exercises, workoutId, day) {
  const mapRef = useRef({});
  const indexRef = useRef({});

  // 'idle' | 'downloading' | 'done' | 'error'
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [downloadProgress, setDownloadProgress] = useState(0); // 0-100
  const isCancelled = useRef(false);

  const workoutKey = `${workoutId}_${day}`;

  // Carrega mapa e índice salvos
  useEffect(() => {
    const load = async () => {
      try {
        const [rawMap, rawIndex] = await Promise.all([
          AsyncStorage.getItem(MAP_KEY),
          AsyncStorage.getItem(INDEX_KEY),
        ]);
        if (rawMap) mapRef.current = JSON.parse(rawMap);
        if (rawIndex) indexRef.current = JSON.parse(rawIndex);

        // Verifica se esse treino já está salvo (e se os arquivos ainda existem em disco)
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
          const allExist = checks.every(Boolean);
          if (allExist && uris.length > 0) setDownloadStatus('done');
        }
      } catch (e) {}
    };
    load();
  }, [workoutKey]);

  const persistMap = async () => {
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(mapRef.current));
  };
  const persistIndex = async () => {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(indexRef.current));
  };

  // Coleta todas as URIs do treino (thumbs + vídeos R2)
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
    // Remove duplicatas
    return [...new Set(uris)];
  }, [exercises]);

  // Download principal — chamado pelo botão
  const startDownload = useCallback(async () => {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return { success: false, reason: 'no_network' };

    isCancelled.current = false;
    setDownloadStatus('downloading');
    setDownloadProgress(0);

    try {
      await ensureDir();
      const uris = collectUris();
      if (uris.length === 0) {
        setDownloadStatus('done');
        return { success: true };
      }

      const downloadedUris = [];
      for (let i = 0; i < uris.length; i++) {
        if (isCancelled.current) break;

        const uri = uris[i];

        // Já em disco — conta como feito
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
        } catch (e) {
          // Falha num asset individual não cancela o resto
        }

        setDownloadProgress(Math.round(((i + 1) / uris.length) * 100));
      }

      // Salva índice desse treino e mapa global
      indexRef.current[workoutKey] = downloadedUris;
      await Promise.all([persistMap(), persistIndex()]);

      setDownloadStatus('done');
      return { success: true };
    } catch (e) {
      setDownloadStatus('error');
      return { success: false, reason: 'error' };
    }
  }, [collectUris, workoutKey]);

  // Exclui os assets desse treino específico
  const deleteDownload = useCallback(async () => {
    try {
      const uris = indexRef.current[workoutKey] || [];
      await Promise.all(
        uris.map(async (uri) => {
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
      setDownloadStatus('idle');
      setDownloadProgress(0);
    } catch (e) {}
  }, [workoutKey]);

  // resolveAsset: devolve path local se existir, URI original se não
  const resolveAsset = useCallback((uri) => {
    if (!uri) return null;
    return mapRef.current[uri] || uri;
  }, []);

  return {
    resolveAsset,
    downloadStatus,   // 'idle' | 'downloading' | 'done' | 'error'
    downloadProgress, // 0-100
    startDownload,
    deleteDownload,
  };
}