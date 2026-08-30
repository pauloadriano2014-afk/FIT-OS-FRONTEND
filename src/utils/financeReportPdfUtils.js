// src/utils/financeReportPdfUtils.js
// 📄 RELATÓRIO FINANCEIRO (apoio para declaração de Imposto de Renda do coach)
//
// Busca os dados em /api/finance/report (só pagamentos CONFIRMED/RECEIVED,
// nada de pendente/vencido) e monta um PDF no mesmo padrão visual dos outros
// documentos do app (ver dietPdfUtils.js) -- no navegador usa window.print(),
// no app usa expo-print + expo-sharing.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { authHeaders } from './authToken';
import { getCoachBrandForPdf, renderBrandBlockHtml, renderPlatformSealHtml } from './brandForPdf';

const API_URL = 'https://fitos-final.onrender.com';

function money(v) {
    return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
}

function dateBR(iso) {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return '—'; }
}

const BILLING_LABELS = {
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão',
    BOLETO: 'Boleto',
    UNDEFINED: 'A escolher',
    CARTAO: 'Cartão',
    DINHEIRO: 'Dinheiro',
    TRANSFERENCIA: 'Transferência',
    OUTRO: 'Outro',
};

const SOURCE_LABELS = {
    ASAAS: 'Asaas',
    MANUAL: 'Manual',
};

// Busca o relatório pronto no backend -- mode: 'annual' | 'monthly'
export async function fetchFinanceReport({ mode, year, month, coachId }) {
    let query = `mode=${mode}&year=${year}`;
    if (mode === 'monthly' && month) query += `&month=${month}`;
    if (coachId) query += `&coachId=${coachId}`;

    const res = await fetch(`${API_URL}/api/finance/report?${query}`, {
        headers: { ...(await authHeaders()) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Erro ao buscar relatório financeiro.');
    return data;
}

function buildRowsAnnual(months) {
    return months.map(m => `
        <tr class="${m.count === 0 ? 'row-empty' : ''}">
            <td class="col-main">${m.monthName}</td>
            <td class="col-num">${m.count}</td>
            <td class="col-num">${money(m.grossValue)}</td>
            <td class="col-num">${money(m.netValue)}</td>
        </tr>`).join('');
}

function buildRowsMonthly(items) {
    if (!items.length) {
        return `<tr><td colspan="6" class="empty-cell">Nenhum pagamento recebido neste mês.</td></tr>`;
    }
    return items.map(p => `
        <tr>
            <td class="col-main">${dateBR(p.paymentDate)}</td>
            <td class="col-main">${p.studentName}${p.isSubscription ? ' 🔄' : ''}</td>
            <td class="col-num">${SOURCE_LABELS[p.source] || '—'}</td>
            <td class="col-num">${BILLING_LABELS[p.billingType] || p.billingType || '—'}</td>
            <td class="col-num">${money(p.value)}</td>
            <td class="col-num">${money(p.netValue)}</td>
        </tr>`).join('');
}

export async function generateFinanceReportPDF({ mode, year, month, coachId }) {
    const data = await fetchFinanceReport({ mode, year, month, coachId });

    const coachBrand = await getCoachBrandForPdf(coachId);
    const brandBlockHtml = renderBrandBlockHtml(coachBrand, { boxWidthPx: 150, align: 'left', textColor: '#fff' });
    const platformSealHtml = renderPlatformSealHtml({ boxWidthPx: 130, align: 'center' });

    const generatedAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const periodLabel = mode === 'annual' ? `Ano de ${data.year}` : `${data.monthName} de ${data.year}`;
    const docTitle = mode === 'annual' ? 'RELATÓRIO FINANCEIRO ANUAL' : 'RELATÓRIO FINANCEIRO MENSAL';

    const tableHead = mode === 'annual'
        ? `<tr><th class="th-main">Mês</th><th class="th-num">Pagamentos</th><th class="th-num">Valor Bruto</th><th class="th-num">Valor Líquido</th></tr>`
        : `<tr><th class="th-main">Data</th><th class="th-main">Aluno</th><th class="th-num">Origem</th><th class="th-num">Forma</th><th class="th-num">Valor Bruto</th><th class="th-num">Valor Líquido</th></tr>`;

    const tableRows = mode === 'annual' ? buildRowsAnnual(data.months) : buildRowsMonthly(data.items);

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>${docTitle} – ${data.coach?.name ?? 'Coach'}</title>
<style>
@page { margin: 0; size: A4; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:#0d0d0d; color:#e8e8e8; font-size:11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.header { background:linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 50%,#150a1f 100%); padding:24px; display:flex; align-items:center; gap:16px; border-bottom:2px solid #8B5CF6; }
.brand-logo-box { flex-shrink:0; }
.header-info { flex:1; }
.doc-title { font-size:19px; font-weight:900; color:#fff; letter-spacing:1px; }
.doc-subtitle { font-size:9px; color:#999; margin-top:3px; }

.coach-block { padding:16px 24px; background:#131313; border-bottom:1px solid #222; display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; }
.coach-info div { font-size:10px; color:#aaa; margin-bottom:2px; }
.coach-info strong { color:#fff; }
.period-badge { align-self:center; background:rgba(139,92,246,0.12); border:1px solid rgba(139,92,246,0.35); color:#B79CFF; font-weight:700; font-size:10px; padding:6px 14px; border-radius:20px; }

.content { padding:20px 24px 24px; }

.summary-row { display:flex; gap:10px; margin-bottom:20px; }
.summary-card { flex:1; background:#161616; border:1px solid #252525; border-radius:10px; padding:14px; }
.summary-label { font-size:8px; letter-spacing:1px; text-transform:uppercase; color:#666; font-weight:700; margin-bottom:5px; }
.summary-value { font-size:17px; font-weight:900; }
.summary-value.gross { color:#8BC34A; }
.summary-value.net { color:#8B5CF6; }
.summary-value.count { color:#fff; }

table { width:100%; border-collapse:collapse; }
thead tr { background:#111; }
.th-main { padding:8px 12px; font-size:8px; letter-spacing:1px; text-transform:uppercase; color:#666; font-weight:700; text-align:left; }
.th-num { padding:8px 10px; font-size:8px; letter-spacing:1px; text-transform:uppercase; color:#666; font-weight:700; text-align:right; }
tbody tr:nth-child(even){ background:#131313; }
tbody tr:nth-child(odd){ background:#161616; }
td { padding:8px 12px; border-top:1px solid #1e1e1e; font-size:10px; }
.col-main { color:#ddd; }
.col-num { color:#aaa; text-align:right; font-variant-numeric: tabular-nums; }
.row-empty td { color:#444; }
.empty-cell { text-align:center; color:#555; font-style:italic; padding:20px; }

tfoot td { padding:10px 12px; border-top:2px solid #8B5CF6; font-weight:900; font-size:10.5px; }
tfoot .col-main { color:#fff; }
tfoot .col-num { color:#8BC34A; text-align:right; }

.disclaimer { margin-top:20px; background:#150a1f; border:1px solid rgba(139,92,246,0.25); border-radius:8px; padding:14px; font-size:9px; color:#999; line-height:1.7; }
.disclaimer strong { color:#B79CFF; }

.footer { margin-top:20px; padding-top:14px; border-top:1px solid #1e1e1e; display:flex; justify-content:space-between; align-items:center; }
.footer-date { font-size:8px; color:#444; }
</style>
</head>
<body>

<div class="header">
    <div class="brand-logo-box">${brandBlockHtml}</div>
    <div class="header-info">
        <div class="doc-title">${docTitle}</div>
        <div class="doc-subtitle">Resumo dos valores recebidos • apoio para declaração de IR</div>
    </div>
</div>

<div class="coach-block">
    <div class="coach-info">
        <div><strong>${data.coach?.name || 'Coach'}</strong></div>
        ${data.coach?.cpf ? `<div>CPF/CNPJ: ${data.coach.cpf}</div>` : ''}
        ${data.coach?.email ? `<div>${data.coach.email}</div>` : ''}
    </div>
    <div class="period-badge">${periodLabel}</div>
</div>

<div class="content">
    <div class="summary-row">
        <div class="summary-card">
            <div class="summary-label">Total Recebido (Bruto)</div>
            <div class="summary-value gross">${money(data.totals.grossValue)}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Total Recebido (Líquido)</div>
            <div class="summary-value net">${money(data.totals.netValue)}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Qtd. de Pagamentos</div>
            <div class="summary-value count">${data.totals.count}</div>
        </div>
    </div>

    <table>
        <thead>${tableHead}</thead>
        <tbody>${tableRows}</tbody>
        <tfoot>
            <tr>
                <td class="col-main" colspan="${mode === 'annual' ? 2 : 4}">TOTAL</td>
                <td class="col-num">${money(data.totals.grossValue)}</td>
                <td class="col-num">${money(data.totals.netValue)}</td>
            </tr>
        </tfoot>
    </table>

    <div class="disclaimer">
        <strong>Sobre este relatório:</strong> os valores acima refletem apenas pagamentos já efetivamente
        recebidos (pendentes ou vencidos não entram nesta soma), somando tanto os pagamentos processados
        pela Asaas quanto os recebimentos lançados manualmente por você (PIX direto, dinheiro, transferência
        etc.), com base na data em que cada um caiu. Recebimentos manuais só aparecem aqui a partir do
        momento em que você começou a registrá-los — não é possível reconstruir automaticamente algo que
        nunca foi lançado. Este documento é um resumo de apoio gerado pela plataforma ELITE FIT; ele não é
        uma nota fiscal nem substitui a orientação do seu contador. Use-o como base para sua declaração de
        Imposto de Renda ou para conferência com seus próprios extratos.
    </div>

    <div class="footer">
        ${platformSealHtml}
        <span class="footer-date">Gerado em ${generatedAt}</span>
    </div>
</div>

</body>
</html>`;

    if (Platform.OS === 'web') {
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(htmlContent);
        win.document.close();
        setTimeout(() => win.print(), 1000);
    } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Relatório Financeiro ${mode === 'annual' ? data.year : `${data.monthName}-${data.year}`}`,
            UTI: 'com.adobe.pdf',
        });
    }
}
