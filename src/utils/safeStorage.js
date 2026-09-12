// src/utils/safeStorage.js
// Helper pra evitar que o localStorage do navegador (usado por baixo do
// AsyncStorage no web) cheio quebre uma ação crítica. O app guarda muito
// cache (dashboard, opções de aluno, treinos, técnicas, etc.) e o
// navegador tem uma cota total por origem (geralmente 5-10MB) -- quando
// estoura, QUALQUER gravação nova falha com QuotaExceededError, inclusive
// gravações pequenas e críticas, tipo trocar de sessão pra "ver como aluno".
//
// Os prefixos abaixo são só CACHE: o próprio app já busca tudo de novo da
// API quando não encontra o cache (ver useDayWorkoutData.js, por exemplo),
// então limpar isso nunca perde dado real do aluno/coach -- só força uma
// busca fresca na próxima vez que a tela precisar.
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISPOSABLE_CACHE_PREFIXES = [
    '@dashboard_cache_',
    '@useroptionscache_',
    '@cached_workout_full_',
    '@cached_workout_',
    '@cached_history_',
    '@cached_system_tech_videos_',
    '@cached_techs_',
    '@global_exercises',
];

function isQuotaError(err) {
    if (!err) return false;
    if (err.name === 'QuotaExceededError') return true;
    return /quota/i.test(String(err.message || err));
}

// Apaga os caches "descartáveis" listados acima pra liberar espaço. Retorna
// quantas chaves foram removidas (0 se não achou nada ou algo deu errado).
export async function clearDisposableCaches() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const toRemove = keys.filter(k => DISPOSABLE_CACHE_PREFIXES.some(p => k.startsWith(p)));
        if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
        return toRemove.length;
    } catch (e) {
        return 0;
    }
}

// Igual AsyncStorage.setItem, mas se a gravação falhar por cota estourada,
// limpa os caches descartáveis e tenta gravar de novo UMA vez antes de
// desistir. Qualquer outro tipo de erro (ou se não sobrou espaço mesmo
// depois de limpar) continua propagando normalmente pro chamador.
export async function setItemSafely(key, value) {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (err) {
        if (!isQuotaError(err)) throw err;
        const cleared = await clearDisposableCaches();
        if (!cleared) throw err;
        await AsyncStorage.setItem(key, value);
    }
}
