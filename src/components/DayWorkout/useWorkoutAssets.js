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
  const mapRef = useRef({});
  const indexRef = useRef({});
  const isDownloading = useRef(false);

  // 'idle' | 'downloading' | 'done' | 'error' | 'web'
  const [downloadStatus, setDownloadStatus] = useState(Platform.OS === 'web' ? 'web' : 'idle');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const workoutKey = `${workoutId}_${day}`;

  // Na web não faz nada
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const load = async () => {
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
    };
    load();
  }, [workoutKey]);

  const persistMap = async () => AsyncStorage.setItem(MAP_KEY, JSON.stringify(mapRef.current));
  const persistIndex = async () => AsyncStorage.setItem(INDEX_KEY, JSON.stringify(indexRef.current));

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

  const startDownload = useCallback(async () => {
    // Web: não suporta download de arquivo
    if (Platform.OS === 'web') {
      return { success: false, reason: 'web_not_supported' };
    }

    if (isDownloading.current) return { success: false, reason: 'already_downloading' };

    // Verifica rede
    if (NetInfo) {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) return { success: false, reason: 'no_network' };
    }

    isDownloading.current = true;
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
    } catch (e) {
      setDownloadStatus('error');
      return { success: false, reason: 'error' };
    } finally {
      isDownloading.current = false;
    }
  }, [collectUris, workoutKey]);

  const deleteDownload = useCallback(async () => {
    if (Platform.OS === 'web') return;

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

  const resolveAsset = useCallback((uri) => {
    if (!uri) return null;
    if (Platform.OS === 'web') return uri; // web sempre usa URI remota
    return mapRef.current[uri] || uri;
  }, []);

  return {
    resolveAsset,
    downloadStatus,   // 'idle' | 'downloading' | 'done' | 'error' | 'web'
    downloadProgress,
    startDownload,
    deleteDownload,
  };
}