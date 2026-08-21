// src/utils/videoEmbedUtils.js
// 🔥 Helper compartilhado pra embutir vídeo de apresentação/aula a partir de
// um link do YouTube ou de um link de embed já pronto (ex: Cloudflare
// Stream). Extraído do padrão já usado em ProdutoCheckoutScreen.js (vídeo de
// apresentação do produto) pra ser reaproveitado também na área de membros
// (ProdutoCursoScreen.js) sem duplicar a regex.
export function getYouTubeId(str) {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = (str || '').match(regExp);
    return match ? match[1] : null;
}

export function getVideoEmbedUrl(url) {
    if (!url) return null;
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    if (isYouTube) {
        const id = getYouTubeId(url);
        return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1` : url;
    }
    // Link "pronto" (ex: embed do Cloudflare Stream) — usa direto como src/uri.
    return url;
}
