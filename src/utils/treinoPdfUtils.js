// src/utils/treinoPdfUtils.js
// 🔥 PDF DO TREINO — gerado sob demanda a partir do `treinoPrograma` (o mesmo
// JSON que alimenta a tela interativa), nunca de um arquivo enviado manualmente.
// A tela interativa é a via oficial; este PDF é só uma cópia pra quem preferir
// baixar. Segue o mesmo padrão de geração usado em dietPdfUtils.js:
// expo-print + expo-sharing no nativo, window.print() na web.
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import {
    calcularRegioesAtivas, gerarSvgMarkup,
} from './muscleMap';

const METODOS = [
    { nome: 'REST-PAUSE', desc: 'Faça uma pausa curta (15 a 20s) e continue até a falha.' },
    { nome: 'FALHA', desc: 'Execute o exercício até não conseguir mais completar uma repetição.' },
    { nome: 'T.U.T.', desc: 'Tempo sob tensão — execute o movimento com controle e cadência adequada.' },
    { nome: 'BI-SET', desc: 'Execute dois exercícios em sequência pro mesmo grupo muscular, sem pausa.' },
    { nome: 'DROP-SET', desc: 'Reduza a carga e continue o exercício até a falha.' },
];

function musculosTexto(valor) {
    if (!valor) return '';
    return Array.isArray(valor) ? valor.join(', ') : String(valor);
}

function renderDiagrama(ex) {
    const { principalFrente, principalCostas, secundarioFrente, secundarioCostas } =
        calcularRegioesAtivas(ex.muscPrincipal, ex.muscSecundario);
    const temFrente = principalFrente.size > 0 || secundarioFrente.size > 0;
    const temCostas = principalCostas.size > 0 || secundarioCostas.size > 0;
    if (!temFrente && !temCostas) return '';

    const partes = [];
    if (temFrente) {
        partes.push(`
            <div class="mapa-view">
                ${gerarSvgMarkup('frente', principalFrente, secundarioFrente, { width: 78, height: 213 })}
                <div class="mapa-label">FRENTE</div>
            </div>`);
    }
    if (temCostas) {
        partes.push(`
            <div class="mapa-view">
                ${gerarSvgMarkup('costas', principalCostas, secundarioCostas, { width: 78, height: 213 })}
                <div class="mapa-label">COSTAS</div>
            </div>`);
    }
    return `<div class="mapa-wrap">${partes.join('')}</div>`;
}

function renderExercicio(ex, idx) {
    const principal = musculosTexto(ex.muscPrincipal);
    const secundario = musculosTexto(ex.muscSecundario);
    return `
        <div class="ex-card">
            <div class="ex-info">
                <div class="ex-header">
                    <span class="ex-num">${ex.ordem ?? idx + 1}</span>
                    <span class="ex-nome">${ex.nome || ''}</span>
                </div>
                ${ex.seriesRepeticoes ? `<div class="ex-series">${ex.seriesRepeticoes}</div>` : ''}
                ${principal ? `<div class="ex-musc"><span class="musc-label principal">Principal:</span> ${principal}</div>` : ''}
                ${secundario ? `<div class="ex-musc"><span class="musc-label secundario">Secundário:</span> ${secundario}</div>` : ''}
                ${ex.orientacao ? `<div class="ex-orientacao">» ${ex.orientacao}</div>` : ''}
            </div>
            ${renderDiagrama(ex)}
        </div>`;
}

function renderTreino(treino, idx) {
    const exerciciosHtml = (treino.exercicios || []).map((ex, exIdx) => renderExercicio(ex, exIdx)).join('');
    return `
        <div class="treino-section">
            <div class="treino-header">
                <span class="treino-num">TREINO ${idx + 1}</span>
                <span class="treino-nome">${treino.nome || treino.foco || ''}</span>
                ${treino.foco && treino.nome ? `<span class="treino-foco">${treino.foco}</span>` : ''}
                ${treino.descanso ? `<span class="treino-descanso">⏱ Descanso: ${treino.descanso}</span>` : ''}
            </div>
            ${exerciciosHtml}
        </div>`;
}

// dados = { nomeCliente, produtoNome, treinoPrograma: { duracaoSemanas, treinos } }
// — exatamente o payload já retornado por GET /api/produtos/treino/[token]
export async function generateTreinoPDF(dados) {
    try {
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        const programa = dados?.treinoPrograma || { treinos: [] };
        const treinos = programa.treinos || [];
        const nomeCliente = dados?.nomeCliente || 'Aluna';
        const produtoNome = dados?.produtoNome || 'Programa de Treino';

        const metodosHtml = METODOS.map(m => `<div class="metodo-item"><span class="metodo-nome">${m.nome}:</span> ${m.desc}</div>`).join('');
        const treinosHtml = treinos.map((t, i) => renderTreino(t, i)).join('');

        const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>${produtoNome} – ${nomeCliente}</title>
<style>
@page { margin: 0; size: A4; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; background:#0a0a0a; color:#e8e8e8; font-size:11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

.header { background:linear-gradient(135deg,#0a0a0a 0%,#151020 50%,#0a0a0a 100%); padding:26px 24px 20px; border-bottom:2px solid #8B5CF6; }
.brand-name { font-size:8px; letter-spacing:3px; color:#8B5CF6; text-transform:uppercase; font-weight:700; margin-bottom:4px; }
.doc-title { font-size:22px; font-weight:900; color:#fff; letter-spacing:0.5px; }
.doc-subtitle { font-size:10px; color:#888; margin-top:4px; }
.aluna-nome { font-size:12px; color:#4DE38F; font-weight:700; margin-top:8px; }

.content { padding:20px 24px 24px; }

.guia { background:#161616; border:1px solid #2a2a2a; border-radius:10px; padding:14px 16px; margin-bottom:20px; }
.guia-titulo { font-size:11px; font-weight:900; color:#fff; letter-spacing:0.3px; margin-bottom:10px; }
.guia-texto { font-size:9.5px; color:#999; line-height:1.7; margin-bottom:8px; }
.metodo-item { font-size:9.5px; color:#999; line-height:1.7; margin-bottom:4px; }
.metodo-nome { color:#4DE38F; font-weight:900; }

.treino-section { margin-top:22px; page-break-inside: avoid; }
.treino-header { background:#161020; border-left:4px solid #8B5CF6; border-radius:6px; padding:10px 14px; margin-bottom:12px; }
.treino-num { display:block; font-size:9px; font-weight:900; color:#8B5CF6; letter-spacing:1px; }
.treino-nome { display:block; font-size:15px; font-weight:900; color:#fff; margin-top:2px; }
.treino-foco { display:block; font-size:10px; color:#999; margin-top:2px; }
.treino-descanso { display:block; font-size:9.5px; color:#777; margin-top:4px; }

.ex-card { background:#141414; border:1px solid #252525; border-radius:10px; padding:14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; page-break-inside: avoid; }
.ex-info { flex:1; min-width:0; }
.ex-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
.ex-num { width:20px; height:20px; border-radius:10px; background:rgba(139,92,246,0.18); color:#8B5CF6; font-size:10px; font-weight:900; display:inline-flex; align-items:center; justify-content:center; text-align:center; line-height:20px; }
.ex-nome { font-size:12.5px; font-weight:900; color:#fff; }
.ex-series { font-size:11px; font-weight:900; color:#4DE38F; margin-bottom:5px; }
.ex-musc { font-size:9.5px; color:#999; margin-bottom:2px; }
.musc-label.principal { color:#8B5CF6; font-weight:700; }
.musc-label.secundario { color:#4DE38F; font-weight:700; }
.ex-orientacao { font-size:9.5px; color:#888; font-style:italic; margin-top:5px; line-height:1.5; }

.mapa-wrap { display:flex; gap:8px; flex-shrink:0; }
.mapa-view { text-align:center; }
.mapa-label { font-size:6.5px; color:#666; font-weight:900; letter-spacing:0.5px; margin-top:2px; }

.footer { margin-top:24px; padding:14px 0; border-top:1px solid #1e1e1e; display:flex; justify-content:space-between; }
.footer-brand { font-size:8px; color:#444; letter-spacing:1px; text-transform:uppercase; }
.footer-date { font-size:8px; color:#333; }
</style>
</head>
<body>

<div class="header">
    <div class="brand-name">PA Team Elite</div>
    <div class="doc-title">${produtoNome}</div>
    <div class="doc-subtitle">Programa de treino${programa.duracaoSemanas ? ` • ${programa.duracaoSemanas} semanas` : ''} • ${today}</div>
    <div class="aluna-nome">${nomeCliente}</div>
</div>

<div class="content">
    <div class="guia">
        <div class="guia-titulo">GUIA DE INÍCIO</div>
        <div class="guia-texto">O número de séries vem antes da barra, as repetições depois. Quando aparece mais de um número (ex: 12/10/8), são séries progressivas. Quando aparecer "+ DROP-SET" ou "+ REST-PAUSE", aplique o método logo após a última série.</div>
        ${metodosHtml}
    </div>
    ${treinosHtml}
    <div class="footer">
        <span class="footer-brand">PA Team Elite · Paulo Adriano</span>
        <span class="footer-date">Gerado em ${today}</span>
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
                dialogTitle: `${produtoNome} - ${nomeCliente}`,
                UTI: 'com.adobe.pdf',
            });
        }
    } catch (error) {
        console.error('Erro ao gerar PDF do treino:', error);
        Alert.alert('Erro', 'Não foi possível gerar o PDF. Tente novamente.');
    }
}
