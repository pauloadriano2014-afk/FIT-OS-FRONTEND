// src/utils/financeInvoiceUtils.js
// 🧾 NOTA FISCAL (NFS-e via Asaas) -- chamadas de API usadas pela tela de
// configuração fiscal e pelo botão "Emitir Nota" por pagamento/recebimento
// (ver FinanceFiscalConfigModal.js / FinanceInvoicesPanel.js). Fase 1: só
// funciona pra conta do Paulo (PA ELITE TEAM LTDA) -- ver app/api/finance/
// invoice no backend pro porquê.
import { authHeaders } from './authToken';

const API_URL = 'https://fitos-final.onrender.com';

async function parseJsonSafe(res) {
    return res.json().catch(() => ({}));
}

// Status fiscal + serviço padrão já salvo (ou null se nunca configurado)
export async function getFiscalConfig() {
    const res = await fetch(`${API_URL}/api/finance/fiscal-config`, {
        headers: { ...(await authHeaders()) },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao consultar configuração fiscal.');
    return data;
}

// Salva o serviço padrão (descrição, serviço municipal, alíquota de ISS)
// usado em toda emissão futura.
export async function saveFiscalConfig({ municipalServiceId, municipalServiceCode, municipalServiceName, serviceDescription, issRate }) {
    const res = await fetch(`${API_URL}/api/finance/fiscal-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ municipalServiceId, municipalServiceCode, municipalServiceName, serviceDescription, issRate }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao salvar configuração fiscal.');
    return data;
}

// Busca os serviços municipais cadastrados na prefeitura da conta (pra
// escolher o "serviço padrão"). search opcional filtra pela descrição.
export async function getMunicipalServices(search) {
    let query = '';
    if (search) query = `?search=${encodeURIComponent(search)}`;
    const res = await fetch(`${API_URL}/api/finance/fiscal-config/municipal-services${query}`, {
        headers: { ...(await authHeaders()) },
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) throw new Error(data?.error || 'Erro ao buscar serviços municipais.');
    return data.services || [];
}

// Emite (agenda) a nota fiscal de um pagamento Asaas (paymentId) ou de um
// recebimento manual (manualReceiptId). cpfCnpj/email só são necessários pra
// recebimento manual sem cliente Asaas ainda vinculado -- se faltar, o
// backend devolve { needsCpf: true } e quem chamou deve pedir e tentar de novo.
export async function emitInvoice({ paymentId, manualReceiptId, cpfCnpj, email }) {
    const res = await fetch(`${API_URL}/api/finance/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ paymentId, manualReceiptId, cpfCnpj, email }),
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
        const err = new Error(data?.error || 'Erro ao emitir nota fiscal.');
        err.needsCpf = !!data?.needsCpf;
        err.needsServiceConfig = !!data?.needsServiceConfig;
        throw err;
    }
    return data;
}
