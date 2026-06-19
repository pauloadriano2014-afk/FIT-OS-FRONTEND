// src/components/Training/TechVideoPlayer.js
import React from 'react';
import { View, Platform, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

// Mesmo extrator de ID usado no VideoPlayerScreen.js, para manter
// consistência: qualquer formato de link do YouTube que já funciona lá
// (youtube.com/watch?v=, youtu.be/, youtube.com/shorts/) funciona aqui também.
const getYouTubeId = (str) => {
  if (!str) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
  const match = str.match(regExp);
  return match ? match[1] : null;
};

export default function TechVideoPlayer({ videoUrl, theme }) {
  const isWeb = Platform.OS === 'web';
  const ytId = getYouTubeId(videoUrl);

  if (!ytId) {
    return (
      <View style={{ padding: 30, alignItems: 'center' }}>
        <Text style={{ color: theme.textSecondary, textAlign: 'center', fontWeight: 'bold' }}>
          Link de vídeo inválido.
        </Text>
      </View>
    );
  }

  // Mesmos parâmetros de embed do VideoPlayerScreen.js (rel=0, modestbranding,
  // playsinline=1), garantindo a mesma experiência de player em todo o app.
  const ytEmbedUrl = `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autohide=1&showinfo=0&controls=1&playsinline=1`;

  // Container 9:16 (vertical), diferente do 16:9 usado no player de execução
  // de exercício — aqui o vídeo é um Short do YouTube, então a proporção é invertida.
  return (
    <View style={{ width: '100%', aspectRatio: 9 / 16, maxHeight: 500, backgroundColor: '#000', borderRadius: 16, overflow: 'hidden' }}>
      {isWeb ? (
        <iframe
          width="100%"
          height="100%"
          src={ytEmbedUrl}
          title="Vídeo demonstrativo da técnica"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          style={{ border: 'none' }}
        />
      ) : (
        <WebView
          style={{ flex: 1, backgroundColor: '#000' }}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          source={{ uri: ytEmbedUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          )}
        />
      )}
    </View>
  );
}