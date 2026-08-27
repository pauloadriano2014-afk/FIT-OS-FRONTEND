// src/utils/authToken.js
// 🔐 Guarda o token de autenticação (JWT) emitido pelo login/register, e
// ajuda a anexar ele nas chamadas que agora exigem identidade verificada no
// servidor (financeiro, gestão de coaches, marca, billing). Antes essas
// rotas confiavam em ids soltos no corpo da requisição — agora o servidor
// confirma quem está chamando de verdade a partir desse token.
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'authToken';

export async function saveAuthToken(token) {
    try {
        if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {}
}

export async function getAuthToken() {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export async function clearAuthToken() {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {}
}

// Uso: headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }
export async function authHeaders() {
    const token = await getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
